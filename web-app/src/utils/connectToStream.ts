import { Peer } from 'peerjs';

export const connectToStream = (
  id: string,
  setRemoteStream: (stream: MediaStream | null) => void
) => {
  const peer = new Peer();

  peer.on('open', () => {
    const conn = peer.connect(id);
    conn.on('open', () => {
      console.log('Connected to DJ!');
    });

    peer.on('call', (call) => {
      call.answer();
      call.on('stream', (stream) => {
        setRemoteStream(stream);
      });
    });
  });
};
