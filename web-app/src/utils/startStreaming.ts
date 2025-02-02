import { Peer } from 'peerjs';

export const startStreaming = async (
  setPeerId: (id: string) => void,
  setIsStreaming: (state: boolean) => void,
  peerRef: React.MutableRefObject<Peer | null>,
  connRef: React.MutableRefObject<any>,
  applyNoiseSuppression: boolean,
  applyFilter: boolean,
  combinedStream: MediaStream
) => {
  try {
    const audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(combinedStream);
    let processedStream = combinedStream;

    if (applyFilter) {
      const lowPassFilter = audioContext.createBiquadFilter();
      lowPassFilter.type = 'lowpass';
      lowPassFilter.frequency.setValueAtTime(1000, audioContext.currentTime);
      source.connect(lowPassFilter);
      const destination = audioContext.createMediaStreamDestination();
      lowPassFilter.connect(destination);
      processedStream = destination.stream;
    }

    const peer = new Peer();
    peerRef.current = peer;

    peer.on('open', (id) => {
      setPeerId(id);
      setIsStreaming(true);
    });

    peer.on('connection', (conn) => {
      connRef.current = conn;
      conn.on('open', () => {
        const call = peer.call(conn.peer, processedStream);
        call.on('error', (err) => console.error('Call error:', err));
      });
    });
  } catch (err) {
    console.error('Error accessing microphone or system audio:', err);
  }
};
