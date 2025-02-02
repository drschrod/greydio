export {};

declare global {
  interface Window {
    electronAPI: {
      startStreaming: () => void;
    };
  }
}
