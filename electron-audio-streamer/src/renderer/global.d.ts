export {};

declare global {
  interface Window {
    electronAPI: {
      enumerateDevices: () => Promise<MediaDeviceInfo[]>;
      getMicStream: (deviceId: string) => Promise<MediaStream>;
    };
  }
}
