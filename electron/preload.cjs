/**
 * Electron Preload Script for ResearchIntern Pro Desktop.
 * Provides secure context isolation bridge between Electron native capabilities and React.
 */
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  isDesktopApp: true,
  sendNotification: (title, body) => {
    ipcRenderer.send('notify', { title, body });
  }
});
