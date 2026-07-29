/* ═══════════════════════════════════════════════════════════════════
   ImagineCode — icon builder
   ───────────────────────────────────────────────────────────────────
   Rasterises build/icon.svg (and the simplified build/icon-small.svg)
   with Chromium, then packs a multi-resolution build/icon.ico.

     npm run icons          # = electron scripts/make-icons.cjs

   Electron does the rendering, so there is no native image dependency
   to install and the icon comes out of exactly the same engine that
   draws the app.
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

const { app, BrowserWindow, nativeImage } = require('electron');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const BUILD = path.join(ROOT, 'build');

// Sizes Windows actually asks for. Anything at or below the cutover uses the
// simplified artwork — the viewfinder frame and the satellite spark stop being
// legible somewhere around 40px and just muddy the silhouette below that.
const ICO_SIZES = [256, 128, 64, 48, 40, 32, 24, 20, 16];
const SMALL_AT_OR_BELOW = 48;

// deterministic output regardless of the machine's display scaling
app.disableHardwareAcceleration();
app.commandLine.appendSwitch('force-device-scale-factor', '1');

const CANVAS = 1024;

// One window, reused. Creating a second transparent BrowserWindow after
// destroying the first fails with ERR_FAILED on Windows, and the artwork is
// resolution-independent anyway — everything is rendered at 1024 and resized
// down by Skia from there.
let studio = null;
function openStudio() {
  studio = new BrowserWindow({
    width: CANVAS,
    height: CANVAS,
    useContentSize: true,
    show: false,
    frame: false,
    transparent: true,
    resizable: false,
    backgroundColor: '#00000000',
    webPreferences: { backgroundThrottling: false, offscreen: false },
  });
  studio.webContents.on('did-fail-load', (_e, code, desc, url) =>
    console.error(`  ✗ load failed ${code} ${desc} — ${url}`)
  );
}

async function rasterise(svgFile) {
  const svg = fs.readFileSync(path.join(BUILD, svgFile), 'utf8').replace(/<\?xml[^>]*\?>/, '');
  const html = `<!doctype html><meta charset="utf-8"><style>
      html,body{margin:0;padding:0;background:transparent;overflow:hidden}
      svg{display:block;width:${CANVAS}px;height:${CANVAS}px}
    </style>${svg}`;
  const stage = path.join(app.getPath('temp'), `imaginecode-icon-${path.parse(svgFile).name}-${process.pid}.html`);
  fs.writeFileSync(stage, html, 'utf8');

  try {
    await studio.loadFile(stage);
  } finally {
    fs.rmSync(stage, { force: true });
  }
  // let the gaussian-blur filters settle before the shutter opens
  await new Promise((r) => setTimeout(r, 350));
  let img = await studio.webContents.capturePage();

  const { width } = img.getSize();
  if (width !== CANVAS) img = img.resize({ width: CANVAS, height: CANVAS, quality: 'best' });
  if (img.isEmpty()) throw new Error(`captured an empty image for ${svgFile}`);
  return img;
}

// ICO: a 6-byte header, one 16-byte directory entry per image, then the
// images themselves. PNG payloads (rather than raw DIBs) are what every
// current icon toolchain emits and what Windows has read since Vista.
function packIco(entries) {
  const ordered = [...entries].sort((a, b) => b.size - a.size);
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);              // reserved
  header.writeUInt16LE(1, 2);              // type: icon
  header.writeUInt16LE(ordered.length, 4);

  const dir = Buffer.alloc(16 * ordered.length);
  let offset = header.length + dir.length;
  ordered.forEach((e, i) => {
    const o = i * 16;
    dir.writeUInt8(e.size >= 256 ? 0 : e.size, o);      // 0 means 256
    dir.writeUInt8(e.size >= 256 ? 0 : e.size, o + 1);
    dir.writeUInt8(0, o + 2);                            // palette size
    dir.writeUInt8(0, o + 3);                            // reserved
    dir.writeUInt16LE(1, o + 4);                         // colour planes
    dir.writeUInt16LE(32, o + 6);                        // bits per pixel
    dir.writeUInt32LE(e.png.length, o + 8);
    dir.writeUInt32LE(offset, o + 12);
    offset += e.png.length;
  });

  return Buffer.concat([header, dir, ...ordered.map((e) => e.png)]);
}

async function main() {
  await app.whenReady();
  openStudio();

  const detailed = await rasterise('icon.svg');
  const simple = await rasterise('icon-small.svg');
  studio.destroy();

  // the master PNG — electron-builder's fallback source, and handy on its own
  fs.writeFileSync(path.join(BUILD, 'icon.png'), detailed.toPNG());
  console.log('  ✓ build/icon.png            1024×1024');

  const entries = ICO_SIZES.map((size) => {
    const src = size <= SMALL_AT_OR_BELOW ? simple : detailed;
    const png = src.resize({ width: size, height: size, quality: 'best' }).toPNG();
    return { size, png };
  });

  const ico = packIco(entries);
  fs.writeFileSync(path.join(BUILD, 'icon.ico'), ico);
  console.log(`  ✓ build/icon.ico            ${ICO_SIZES.join(', ')} · ${(ico.length / 1024).toFixed(0)} KB`);

  // 256px PNG for the in-app about/splash art and anything that wants a bitmap
  fs.writeFileSync(
    path.join(BUILD, 'icon-256.png'),
    detailed.resize({ width: 256, height: 256, quality: 'best' }).toPNG()
  );
  console.log('  ✓ build/icon-256.png        256×256');

  app.exit(0);
}

main().catch((err) => {
  console.error('icon build failed —', err);
  app.exit(1);
});
