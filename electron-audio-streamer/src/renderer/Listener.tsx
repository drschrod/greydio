import React, { useEffect, useRef } from 'react';
import Peer from 'peerjs';

const Listener: React.FC = () => {
    const audioRef = useRef<HTMLAudioElement>(null);

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const peerId = urlParams.get('peerId');

        if (peerId) {
            const peer = new Peer();

            peer.on('open', () => {
                const conn = peer.connect(peerId);
                conn.on('open', () => {
                    console.log('Connected to streamer!');
                });

                // Answer incoming call and play the audio stream
                peer.on('call', (call) => {
                    call.answer();
                    call.on('stream', (stream) => {
                        if (audioRef.current) {
                            audioRef.current.srcObject = stream;
                            audioRef.current.play();
                        }
                        console.log('Receiving audio stream from streamer.');
                    });
                });
            });
        }
    }, []);

    return (
        <div style={{ textAlign: 'center', padding: '20px' }}>
            <h1>Listening to Stream</h1>
            <audio ref={audioRef} controls autoPlay />
        </div>
    );
};

export default Listener;
