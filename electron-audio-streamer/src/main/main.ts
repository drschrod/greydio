import { app, BrowserWindow } from 'electron';
import path from 'path';
import { Express } from 'express';
import { ExpressPeerServer } from 'peer';
import express from 'express';

let mainWindow: BrowserWindow | null;

process.env.DEBUG = 'peer*';

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // Load the renderer (React) app
  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
};

// Start PeerJS Server with Express
const startPeerServer = () => {
  const expressApp: Express = express();
  const server = expressApp.listen(9000, () => {
    console.log('PeerJS server running on http://localhost:9000');
  });

  // Attach PeerJS server to Express
  const peerServer = ExpressPeerServer(server, {
    path: '/',
  });

  expressApp.use('/peerjs', peerServer);
};

// Electron app events
app.whenReady().then(() => {
  createWindow();
  startPeerServer();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
