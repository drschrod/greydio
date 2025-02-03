const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Expose media device enumeration
  enumerateDevices: async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices;
    } catch (error) {
      console.error('Error enumerating devices:', error);
      throw error;
    }
  },

  // Expose microphone capture if needed in future
  getMicStream: async (deviceId: string) => {
    try {
      const micStream = await navigator.mediaDevices.getUserMedia({
        audio: { deviceId }
      });
      return micStream;
    } catch (error) {
      console.error('Error capturing microphone:', error);
      throw error;
    }
  }
});
