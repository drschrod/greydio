import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';

const createWindow = () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,  // Important for security
      nodeIntegration: false,
    },
  });

  win.loadFile('index.html');
};

app.whenReady().then(createWindow);

// Handle the start-streaming event
ipcMain.on('start-streaming', () => {
  console.log('System audio streaming started!');
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
