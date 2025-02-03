import React, { useState, useRef } from 'react';
import Peer from 'peerjs';
import { useNavigate } from 'react-router-dom';

const Listener: React.FC = () => {
    const [inputPeerId, setInputPeerId] = useState('');
    const audioRef = useRef<HTMLAudioElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const navigate = useNavigate();

    const handleConnect = () => {
        if (!inputPeerId) return;

        const peer = new Peer({
            host: '127.0.0.1',
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
            const conn = peer.connect(inputPeerId);
            conn.on('open', () => {
                console.log('Connected to streamer!');
            });
            peer.on('call', (call) => {
                call.answer();
                call.on('stream', (stream) => {
                    if (audioRef.current) {
                        audioRef.current.srcObject = stream;
                        audioRef.current.play();
                    }
                    console.log('Receiving audio stream from streamer.');
                    initializeVUMeter(stream);
                });
            });
        });
    };

    const initializeVUMeter = (stream: MediaStream) => {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);

        const canvas = canvasRef.current;
        const canvasContext = canvas?.getContext('2d');

        const draw = () => {
            if (!canvas || !canvasContext) return;

            analyser.getByteFrequencyData(dataArray);

            canvasContext.clearRect(0, 0, canvas.width, canvas.height);

            const barWidth = (canvas.width / bufferLength) * 2.5;
            let barHeight;
            let x = 0;

            for (let i = 0; i < bufferLength; i++) {
                barHeight = dataArray[i];
                canvasContext.fillStyle = `rgb(50, ${barHeight + 100}, 50)`;  // Green bars
                canvasContext.fillRect(x, canvas.height - barHeight / 2, barWidth, barHeight / 2);
                x += barWidth + 1;
            }

            requestAnimationFrame(draw);
        };

        draw();
    };

    return (
        <div style={{ textAlign: 'center', padding: '20px' }}>
            <h1>Join a Stream</h1>
            <p>Enter the Peer ID to connect:</p>

            <input
                type="text"
                value={inputPeerId}
                onChange={(e) => setInputPeerId(e.target.value)}
                placeholder="Enter Peer ID"
                style={{ width: '60%', padding: '8px', marginBottom: '20px' }}
            />

            <div>
                <button onClick={handleConnect} style={{ marginRight: '10px' }}>
                    Connect
                </button>

                <button onClick={() => navigate('/')}>
                    Back to Home
                </button>
            </div>

            {/* VU Meter Canvas */}
            <div style={{ marginTop: '20px' }}>
                <canvas ref={canvasRef} width="400" height="100" style={{ border: '1px solid #ccc' }} />
            </div>

            {/* Audio Player */}
            <audio ref={audioRef} controls autoPlay />
        </div>
    );
};

export default Listener;
