/* ═══════════════════════════════════════════════════════════════════
   ImagineCode — social preview builder
   ───────────────────────────────────────────────────────────────────
   Rasterises scripts/social-preview.html into social-preview.png,
   1280 × 640 — the size GitHub asks for under
   Settings → General → Social preview.

     npm run social         # = electron scripts/make-social.cjs

   Rendered at 2× and resampled down, so hairlines, phosphor glows and
   Fraunces at 53px all land clean. Same engine that draws the IDE.

   The capture goes through the DevTools protocol rather than
   capturePage(): a 2560×1280 window is larger than most displays and
   the OS clamps it, which crops the card. Page.captureScreenshot
   rasterises at whatever scale it is asked for, screen or no screen.
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

const { app, BrowserWindow, nativeImage } = require('electron');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SOURCE = path.join(__dirname, 'social-preview.html');
const OUT = path.join(ROOT, 'social-preview.png');

const W = 1280;
const H = 640;
const SCALE = 2; // supersample, then resample down

// deterministic output regardless of the machine's display scaling
app.disableHardwareAcceleration();
app.commandLine.appendSwitch('force-device-scale-factor', '1');

/* Rasterise the page. The DevTools protocol takes a `scale` on its clip, so it
   can supersample past what the window itself is; capturePage() cannot, and is
   kept as the 1× safety net if the protocol route stalls or is unavailable. */
async function capture(win) {
  const dbg = win.webContents.debugger;
  try {
    dbg.attach('1.3');
    await dbg.sendCommand('Page.enable');
    const shot = await Promise.race([
      dbg.sendCommand('Page.captureScreenshot', {
        format: 'png',
        fromSurface: true,
        clip: { x: 0, y: 0, width: W, height: H, scale: SCALE },
      }),
      new Promise((_r, reject) =>
        setTimeout(() => reject(new Error('Page.captureScreenshot timed out')), 30000)
      ),
    ]);
    dbg.detach();
    return nativeImage.createFromBuffer(Buffer.from(shot.data, 'base64'));
  } catch (err) {
    console.warn(`  ! ${SCALE}× capture unavailable (${err.message}) — falling back to 1×`);
    try {
      dbg.detach();
    } catch {}
    return win.webContents.capturePage();
  }
}

async function main() {
  await app.whenReady();

  // Shown, not hidden: the compositor only produces frames for a live surface,
  // and Page.captureScreenshot waits forever for one that never arrives. It is
  // on screen for about two seconds.
  const win = new BrowserWindow({
    width: W,
    height: H,
    useContentSize: true,
    show: true,
    frame: false,
    resizable: false,
    skipTaskbar: true,
    backgroundColor: '#08080a',
    webPreferences: { backgroundThrottling: false, offscreen: false },
  });

  win.webContents.on('did-fail-load', (_e, code, desc, url) =>
    console.error(`  ✗ load failed ${code} ${desc} — ${url}`)
  );

  await win.loadFile(SOURCE);

  // Fraunces / Schibsted Grotesk / Fragment Mono come off Google Fonts, and
  // the card is nothing without them — wait for the faces, then report which
  // ones actually arrived so a silent fallback to Georgia never ships.
  const fonts = await win.webContents.executeJavaScript(`
    (async () => {
      await Promise.race([
        document.fonts.ready,
        new Promise((r) => setTimeout(r, 15000)),
      ]);
      return ['Fraunces', 'Schibsted Grotesk', 'Fragment Mono']
        .map((f) => f + (document.fonts.check('16px "' + f + '"') ? ' ✓' : ' ✗ FALLBACK'));
    })()
  `);
  fonts.forEach((f) => console.log(`  · ${f}`));

  // let the blurs, masks and gradients settle before the shutter opens
  await new Promise((r) => setTimeout(r, 900));

  let img = await capture(win);
  const size = img.getSize();
  if (img.isEmpty()) throw new Error('captured an empty image');

  // A capture off the 2:1 ratio means the surface was clamped and the card is
  // cropped — resizing that would ship a squashed image without saying so.
  if (Math.abs(size.width / size.height - W / H) > 0.01 || size.width < W) {
    throw new Error(
      `captured ${size.width}×${size.height}, expected ${W * SCALE}×${H * SCALE} — ` +
        'the render surface was clamped, so the card is cropped'
    );
  }

  if (size.width !== W || size.height !== H) {
    img = img.resize({ width: W, height: H, quality: 'best' });
  }

  fs.writeFileSync(OUT, img.toPNG());
  const kb = (fs.statSync(OUT).size / 1024).toFixed(0);
  console.log(`  ✓ social-preview.png        ${W}×${H} · captured ${size.width}×${size.height} · ${kb} KB`);

  win.destroy();
  app.exit(0);
}

main().catch((err) => {
  console.error('social preview build failed —', err);
  app.exit(1);
});
