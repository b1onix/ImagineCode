/* ImagineCode — main window bridge.
   The IDE runs with contextIsolation and sandboxing on, so this is the entire
   surface it can reach the operating system through. Everything here is a
   window-chrome concern; nothing touches the filesystem or the compiler. */
'use strict';

const { contextBridge, ipcRenderer } = require('electron');

// The preview iframe is same-origin, so a compiled site could otherwise reach
// this bridge through parent.imagine and close the IDE out from under its own
// unsaved-changes prompt. Everything the compiler writes is model-generated
// from whatever the dreamer imagined — it does not get window controls.
if (process.isMainFrame) {

contextBridge.exposeInMainWorld('imagine', {
  platform: process.platform,

  // window controls, since the app draws its own title bar
  minimize: () => ipcRenderer.send('win:minimize'),
  toggleMaximize: () => ipcRenderer.send('win:toggle-maximize'),
  close: () => ipcRenderer.send('win:close'),
  onMaximizeChange: (cb) => ipcRenderer.on('win:maximized', (_e, v) => cb(v)),

  // so the shell can warn before closing on unsaved imagination
  setDirtyCount: (n) => ipcRenderer.send('app:dirty-count', n),
  onSaveAll: (cb) => ipcRenderer.on('app:save-all', () => cb()),
  savedAll: (result) => ipcRenderer.send('app:saved-all', result),
});

}
