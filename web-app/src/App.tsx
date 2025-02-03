import React, { useEffect, useRef, useState } from 'react';
import Peer from 'peerjs';

const App: React.FC = () => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [hasConnected, setHasConnected] = useState(false);  // Prevent multiple calls

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const peerId = urlParams.get('peerId');

    if (peerId && !hasConnected) {
      console.log('Connecting to Peer ID:', peerId);

      const peer = new Peer({
        host: '127.0.0.1',  // Ensure this points to the correct PeerJS server
        port: 9000,
        path: '/peerjs',
        config: {
          iceTransportPolicy: 'relay',  // Force relay via TURN server
          iceServers: [{ urls: 'stun:stun.l.google.com:19302' }, {
            urls: 'turn:numb.viagenie.ca',
            credential: 'muazkh',
            username: 'webrtc@live.com'
          }]
        },
      });

      peer.on('open', () => {
        console.log('PeerJS connection opened. Attempting to call:', peerId);

        const emptyStream = new MediaStream();
        const call = peer.call(peerId, emptyStream);

        if (!call) {
          console.error('Call object is undefined. Possible reasons:');
          return;
        }
        call.peerConnection?.addEventListener('icecandidate', (event) => {
          if (event.candidate) {
            const candidateStr = event.candidate.candidate;
            if (candidateStr.includes('typ host') && candidateStr.includes('192.168')) {
              console.log('Using IPv4 host candidate:', event.candidate);
            } else {
              console.log('Ignoring non-IPv4 candidate:', event.candidate);
            }
          }
        });
        // Handle incoming stream from the streamer
        call.on('stream', (stream) => {
          console.log('Received audio stream:', stream);

          const audioTracks = stream.getAudioTracks();
          if (audioTracks.length === 0) {
            console.error('No audio tracks found in received stream.');
          } else {
            console.log('Received audio tracks:', audioTracks);
            audioTracks.forEach(track => {
              console.log(`Track: ${track.label}, Enabled: ${track.enabled}, Muted: ${track.muted}, ReadyState: ${track.readyState}`);
            });
          }

          if (audioRef.current) {
            audioRef.current.srcObject = stream;
            audioRef.current.play().catch(err => {
              console.error('Autoplay failed, prompting user to click play:', err);
              alert('Click the play button to start listening!');
            });
          }
        });


        // Handle ICE candidates from the streamer
        call.peerConnection?.addEventListener('icecandidate', (event) => {
          if (event.candidate) {
            console.log('Listener ICE candidate:', event.candidate);
          }
        });

        call.on('error', (err) => {
          console.error('Error during call:', err);
        });
      });


      peer.on('error', (err) => {
        console.error('PeerJS connection error:', err);
      });
    }
  }, [hasConnected]);

  return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <h1>Listening to Greydio Stream</h1>
      <audio ref={audioRef} controls autoPlay />
    </div>
  );
};

export default App;
