/* ═══════════════════════════════════════════════════════════════════
   ImagineCode — desktop shell
   ───────────────────────────────────────────────────────────────────
   The IDE is a web app talking to an Express "compiler" backend, so the
   shell's job is small and specific:

     · start server.js in its own Node process and wait for its port
     · hold an animated splash up while that happens
     · open one frameless window on the result and get out of the way

   Everything the dreamer creates lives in userData, never next to the
   installed program — Program Files is read-only for good reasons.
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

const { app, BrowserWindow, ipcMain, shell, dialog, Menu, screen, session } = require('electron');
const { fork, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const APP_ROOT = app.getAppPath();
const DEV = !app.isPackaged;
const BOOT_TIMEOUT_MS = 30_000;

// ---------------------------------------------------------------- paths

const DATA_DIR = app.getPath('userData');
const STATE_FILE = path.join(DATA_DIR, 'window-state.json');

// What a brand-new install starts with. Normally the two bundled examples —
// but running from a checkout that already has a workspace, that workspace is
// the more useful starting point, so nobody's existing files vanish the first
// time they launch the desktop build.
function seedDir() {
  const local = path.join(APP_ROOT, 'workspace');
  try {
    if (fs.existsSync(local) && fs.readdirSync(local).length) return local;
  } catch {}
  return path.join(APP_ROOT, 'resources', 'seed-workspace');
}

// Only needed while developing: an installed build takes its window and
// taskbar icon straight from the .exe, which electron-builder has already
// stamped with build/icon.ico.
const devIcon = path.join(APP_ROOT, 'build', 'icon.ico');
const ICON = DEV && fs.existsSync(devIcon) ? devIcon : undefined;

// The Agent SDK locates its native CLI with require.resolve, relative to its
// own file. That works in a checkout; in an installed app the lookup can miss,
// so we resolve it here and hand the answer to the server explicitly.
function findClaudeBinary() {
  const pkg = `@anthropic-ai/claude-agent-sdk-${process.platform}-${process.arch}`;
  const exe = process.platform === 'win32' ? 'claude.exe' : 'claude';
  const candidates = [
    path.join(APP_ROOT, 'node_modules', pkg, exe),
    path.join(process.resourcesPath || '', 'app.asar.unpacked', 'node_modules', pkg, exe),
    path.join(process.resourcesPath || '', 'app', 'node_modules', pkg, exe),
  ];
  for (const c of candidates) {
    try { if (fs.existsSync(c)) return c; } catch {}
  }
  return null;
}

// ---------------------------------------------------------------- window state

function readState() {
  try {
    const s = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    if (typeof s.width !== 'number' || typeof s.height !== 'number') return null;
    return onSomeDisplay(s) ? s : { width: s.width, height: s.height, maximized: s.maximized };
  } catch {}
  return null;
}

// Undock a laptop, unplug a projector, drop the resolution — and yesterday's
// coordinates can land the window on a monitor that no longer exists. The
// window would be alive, focused and completely invisible, and with frame:false
// there is no title bar to drag it back with. Dropping x/y makes Electron
// centre it on the primary display instead.
function onSomeDisplay(s) {
  if (typeof s.x !== 'number' || typeof s.y !== 'number') return false;
  const MIN_VISIBLE = 80; // enough of the window to grab hold of
  return screen.getAllDisplays().some(({ workArea: w }) =>
    s.x + s.width - MIN_VISIBLE > w.x &&
    s.x + MIN_VISIBLE < w.x + w.width &&
    s.y + s.height - MIN_VISIBLE > w.y &&
    // the top edge must be reachable — a window dragged down past the taskbar
    // can never be moved again
    s.y >= w.y - 8 && s.y < w.y + w.height - 40
  );
}

function writeState(win) {
  if (!win || win.isDestroyed()) return;
  // a minimized window reports neither its real bounds nor its real maximized
  // state, so remembering it would come back as a small restored window
  if (win.isMinimized()) return;
  const maximized = win.isMaximized();
  const b = maximized ? win.getNormalBounds() : win.getBounds();
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify({ ...b, maximized }, null, 2));
  } catch {}
}

// resize and move fire continuously while a window is being dragged; writing
// the file on every one of them would be hundreds of synchronous writes
let stateTimer = null;
function scheduleWriteState(win) {
  clearTimeout(stateTimer);
  stateTimer = setTimeout(() => writeState(win), 400);
}

// ---------------------------------------------------------------- the server

const server = {
  child: null,
  url: null,
  log: [],
};

function startServer(onStage) {
  return new Promise((resolve, reject) => {
    onStage('waking the compiler daemon');

    const env = {
      ...process.env,
      ELECTRON_RUN_AS_NODE: '1',
      IMAGINECODE_DESKTOP: '1',
      IMAGINECODE_VERSION: app.getVersion(),
      IMAGINECODE_DATA_DIR: DATA_DIR,
      IMAGINECODE_SEED_DIR: seedDir(),
      PORT: String(process.env.IMAGINECODE_PORT || 3333),
    };
    const claudeBin = findClaudeBinary();
    if (claudeBin) env.IMAGINECODE_CLAUDE_BIN = claudeBin;

    server.child = fork(path.join(APP_ROOT, 'server.js'), [], {
      env,
      cwd: APP_ROOT,
      execPath: process.execPath,
      stdio: ['ignore', 'pipe', 'pipe', 'ipc'],
      windowsHide: true,
    });

    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      reject(new Error('the compiler daemon did not answer in time'));
    }, BOOT_TIMEOUT_MS);

    const keep = (buf) => {
      const text = String(buf);
      server.log.push(text);
      if (server.log.length > 80) server.log.shift();
      if (DEV) process.stdout.write(text);
    };
    server.child.stdout?.on('data', keep);
    server.child.stderr?.on('data', keep);

    onStage('opening a port on localhost');

    server.child.on('message', (msg) => {
      if (msg?.type === 'listening' && !settled) {
        settled = true;
        clearTimeout(timer);
        server.url = msg.url;
        resolve(msg.url);
      } else if (msg?.type === 'fatal' && !settled) {
        settled = true;
        clearTimeout(timer);
        reject(new Error(msg.message));
      }
    });

    server.child.on('error', (err) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(err);
    });

    server.child.on('exit', (code) => {
      server.child = null;
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        reject(new Error(`the compiler daemon stopped with code ${code}\n${server.log.join('').slice(-600)}`));
        return;
      }
      // it died after a successful boot: every file operation and every build
      // in the open window would now fail silently, so say so out loud
      onServerLost(code);
    });
  });
}

// Killing the forked server is not enough: a build in flight has the Agent
// SDK's 260 MB claude.exe as a grandchild, and orphaning that leaves it writing
// into the output directory of an app the user already closed — and holding the
// port against the next launch. taskkill /T takes the whole tree.
function stopServer() {
  quitting = true;
  const child = server.child;
  if (!child) return;
  server.child = null;
  try {
    if (process.platform === 'win32' && child.pid) {
      spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'], { windowsHide: true, stdio: 'ignore' })
        .on('error', () => { try { child.kill(); } catch {} });
    } else {
      child.kill();
    }
  } catch {
    try { child.kill(); } catch {}
  }
}

function onServerLost(code) {
  if (quitting || !main || main.isDestroyed()) return;
  const pick = dialog.showMessageBoxSync(main, {
    type: 'error',
    buttons: ['Restart ImagineCode', 'Quit'],
    defaultId: 0,
    cancelId: 1,
    noLink: true,
    title: 'ImagineCode',
    message: 'The compiler backend stopped unexpectedly.',
    detail: `It exited with code ${code}. Nothing in the editor can be saved or compiled until it is back.`,
  });
  forceClose = true;
  if (pick === 0) { app.relaunch(); }
  app.quit();
}

// ---------------------------------------------------------------- windows

let splash = null;
let main = null;
let dirtyCount = 0;
let forceClose = false;
let quitting = false;

function createSplash() {
  splash = new BrowserWindow({
    width: 520,
    height: 340,
    useContentSize: true,
    frame: false,
    transparent: true,
    resizable: false,
    maximizable: false,
    minimizable: false,
    center: true,
    show: false,
    backgroundColor: '#00000000',
    icon: ICON,
    title: 'ImagineCode',
    webPreferences: {
      preload: path.join(__dirname, 'splash-preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  splashReady = false;
  splashQueue.length = 0;
  splash.webContents.once('dom-ready', () => {
    splashReady = true;
    for (const [channel, payload] of splashQueue.splice(0)) {
      if (splash && !splash.isDestroyed()) splash.webContents.send(channel, payload);
    }
  });

  splash.loadFile(path.join(__dirname, 'splash.html'), { query: { v: app.getVersion() } });
  splash.once('ready-to-show', () => splash?.show());
  splash.on('closed', () => { splash = null; });
  return splash;
}

// The server can fail in ~100ms, which is well before the splash renderer has
// run its inline script and subscribed. Sending straight to webContents would
// drop those messages on the floor — including boot:error, which is the only
// thing standing between the user and a splash that spins forever.
let splashReady = false;
const splashQueue = [];

function splashSend(channel, payload) {
  if (!splash || splash.isDestroyed()) return;
  if (splashReady) splash.webContents.send(channel, payload);
  else splashQueue.push([channel, payload]);
}

function splashStage(text, progress) {
  splashSend('boot:stage', { text, progress });
}

function createMain(url) {
  const saved = readState();
  main = new BrowserWindow({
    width: saved?.width ?? 1360,
    height: saved?.height ?? 860,
    x: saved?.x,
    y: saved?.y,
    minWidth: 900,
    minHeight: 560,
    show: false,
    frame: false,
    backgroundColor: '#0b0b0e',
    icon: ICON,
    title: 'ImagineCode',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: false,
    },
  });
  if (saved?.maximized) main.maximize();

  const tellMaximized = () => main?.webContents.send('win:maximized', main.isMaximized());
  main.on('maximize', tellMaximized);
  main.on('unmaximize', tellMaximized);
  main.on('resize', () => scheduleWriteState(main));
  main.on('move', () => scheduleWriteState(main));

  // links and "open in browser" belong to the user's browser, not to a second
  // chrome-less Electron window with no address bar
  main.webContents.setWindowOpenHandler(({ url: target }) => {
    if (/^https?:/i.test(target)) shell.openExternal(target);
    return { action: 'deny' };
  });
  // the app is a single page; nothing should ever navigate it away
  main.webContents.on('will-navigate', (e, target) => {
    if (!target.startsWith(server.url)) {
      e.preventDefault();
      if (/^https?:/i.test(target)) shell.openExternal(target);
    }
  });

  main.on('close', onMainClose);
  main.on('closed', () => { main = null; });

  main.loadURL(url);
  return main;
}

function onMainClose(e) {
  if (forceClose || !dirtyCount) { clearTimeout(stateTimer); writeState(main); return; }
  e.preventDefault();

  const n = dirtyCount;
  const response = dialog.showMessageBoxSync(main, {
    type: 'warning',
    buttons: ['Save and close', "Don't save", 'Cancel'],
    defaultId: 0,
    cancelId: 2,
    noLink: true,
    title: 'ImagineCode',
    message: `${n} imagination file${n === 1 ? ' has' : 's have'} unsaved changes.`,
    detail: 'Even imagination has an undo problem. Save before closing?',
  });

  if (response === 2) return;
  if (response === 1) { forceClose = true; main.close(); return; }

  // save, then close — but never hang the window on a save that never answers,
  // never leave a listener behind that could close the window later, and never
  // close on a save that actually failed
  let settled = false;
  const done = (_e, result) => {
    if (settled) return;
    settled = true;
    clearTimeout(timer);
    ipcMain.removeListener('app:saved-all', done);

    if (result && result.ok === false) {
      dialog.showMessageBoxSync(main, {
        type: 'error',
        buttons: ['Keep the window open'],
        noLink: true,
        title: 'ImagineCode',
        message: 'Those files could not be saved.',
        detail: `${result.error || 'The compiler backend did not answer.'}\n\nNothing was closed, so your imagination is still here.`,
      });
      return;
    }
    forceClose = true;
    main?.close();
  };
  const timer = setTimeout(done, 5000);
  ipcMain.once('app:saved-all', done);
  main.webContents.send('app:save-all');
}

// ---------------------------------------------------------------- ipc

ipcMain.on('win:minimize', () => main?.minimize());
ipcMain.on('win:toggle-maximize', () => {
  if (!main) return;
  main.isMaximized() ? main.unmaximize() : main.maximize();
});
ipcMain.on('win:close', () => main?.close());
ipcMain.on('app:dirty-count', (_e, n) => { dirtyCount = Number(n) || 0; });
ipcMain.on('splash:quit', () => app.quit());

// ---------------------------------------------------------------- boot

async function boot() {
  createSplash();

  try {
    const url = await startServer(splashStage);
    splashStage('loading the editor', 0.62);

    const win = createMain(url);

    const loaded = await new Promise((resolve) => {
      let settled = false;
      const go = (ok) => { if (!settled) { settled = true; resolve(ok); } };
      win.webContents.once('did-finish-load', () => go(true));
      win.webContents.once('did-fail-load', (_e, code, desc) => go(`${desc || 'load failed'} (${code})`));
      setTimeout(() => go('the editor took too long to load'), 20_000);
    });
    if (loaded !== true) throw new Error(String(loaded));

    splashStage('ready', 1);
    splashSend('boot:done');

    // let the splash play its exit before the window takes over
    await new Promise((r) => setTimeout(r, 460));
    win.show();
    win.focus();
    win.webContents.send('win:maximized', win.isMaximized());
    if (splash && !splash.isDestroyed()) splash.destroy();
    if (DEV) win.webContents.openDevTools({ mode: 'detach' });
  } catch (err) {
    const message = String(err?.message || err);
    // a half-loaded frameless window has no title bar and no menu — there would
    // be nothing to close it with, so it never gets shown
    if (main && !main.isDestroyed()) { forceClose = true; main.destroy(); }

    if (splash && !splash.isDestroyed()) {
      splashSend('boot:error', { message });
      // last resort: if the splash renderer never came up either, the failure
      // would otherwise be completely invisible
      setTimeout(() => {
        if (splashReady || !splash || splash.isDestroyed()) return;
        dialog.showErrorBox('ImagineCode could not start', message);
        app.quit();
      }, 4000);
    } else {
      dialog.showErrorBox('ImagineCode could not start', message);
      app.quit();
    }
  }
}

// ---------------------------------------------------------------- lifecycle

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    // during a slow boot there is no main window yet — surfacing the splash is
    // the only way to answer a second double-click at all
    const win = main || splash;
    if (!win || win.isDestroyed()) return;
    if (win.isMinimized?.()) win.restore();
    win.show();
    win.focus();
  });

  app.setAppUserModelId('com.imaginecode.app');
  // the IDE ships its own menu bar in the title bar; a native one would just
  // steal accelerators from it
  Menu.setApplicationMenu(null);

  app.whenReady().then(() => {
    session.defaultSession.setPermissionRequestHandler((_wc, _perm, cb) => cb(false));
    boot();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) boot();
    });
  });

  app.on('window-all-closed', () => app.quit());
  app.on('before-quit', stopServer);
  app.on('quit', stopServer);
  process.on('exit', stopServer);
}
