/* ImagineCode — splash bridge. Boot progress in, a quit button out. */
'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('boot', {
  onStage: (cb) => ipcRenderer.on('boot:stage', (_e, payload) => cb(payload)),
  onDone: (cb) => ipcRenderer.on('boot:done', () => cb()),
  onError: (cb) => ipcRenderer.on('boot:error', (_e, payload) => cb(payload)),
  quit: () => ipcRenderer.send('splash:quit'),
});
