const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    startStreaming: () => ipcRenderer.send('start-streaming')
});
