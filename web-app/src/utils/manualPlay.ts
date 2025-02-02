export const manualPlay = (
    audioRef: React.RefObject<HTMLAudioElement>,
    setAutoplayFailed: (state: boolean) => void
  ) => {
    if (audioRef.current) {
      audioRef.current.play().catch((err) => {
        console.error('Manual play failed:', err);
      });
    }
    setAutoplayFailed(false);
  };
  