const { contextBridge, ipcRenderer } = require('electron');

// Expose secure API endpoints to the React app
contextBridge.exposeInIsolatedWorld('electronAPI', {
  getPlatformVersion: () => ipcRenderer.invoke('get-platform-version'),
  // Add more secure IPC APIs here for deeper native integration
});
