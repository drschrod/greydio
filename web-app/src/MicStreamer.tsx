import React, { useState, useRef } from 'react';
import { Peer } from 'peerjs';

const MicStreamer: React.FC = () => {
    const [peerId, setPeerId] = useState('');
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
    const peerRef = useRef<Peer | null>(null);
    const connRef = useRef<any>(null);

    const startStreaming = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            const peer = new Peer(); // Automatically generates an ID
            peerRef.current = peer;

            peer.on('open', (id) => {
                console.log('My peer ID is: ' + id);
                setPeerId(id); // Display the ID to share with listeners
            });

            peer.on('connection', (conn) => {
                connRef.current = conn;
                conn.on('open', () => {
                    console.log('Listener connected');
                    conn.send('Audio stream incoming');

                    const call = peer.call(conn.peer, stream);
                    call.on('error', (err) => console.error('Call error:', err));
                });
            });
        } catch (err) {
            console.error('Error accessing microphone:', err);
        }
    };

    const connectToStream = (id: string) => {
        const peer = new Peer(); // Create a new peer for the listener

        peer.on('open', () => {
            const conn = peer.connect(id);

            conn.on('open', () => {
                console.log('Connected to DJ!');
            });

            conn.on('data', (data) => {
                console.log('Message from DJ:', data);
            });

            peer.on('call', (call) => {
                call.answer(); // Answer the call with no media (since we're just listening)
                call.on('stream', (stream) => {
                    console.log('Receiving stream:', stream);
                    setRemoteStream(stream);
                });
            });
        });
    };

    return (
        <div className="flex flex-col items-center justify-center h-screen space-y-4">
            <h2 className="text-2xl font-bold">Mic Streamer</h2>

            {!peerId ? (
                <button onClick={startStreaming} className="px-4 py-2 bg-green-500 text-white rounded-xl">
                    Start Streaming
                </button>
            ) : (
                <div>
                    <h3>Share this ID with Listeners:</h3>
                    <textarea
                        readOnly
                        value={peerId}
                        className="w-full h-12 p-2 border rounded-lg text-center"
                    />
                </div>
            )}

            <div className="w-full max-w-md mt-4">
                <h3>Join a Stream:</h3>
                <input
                    type="text"
                    placeholder="Enter DJ's Peer ID"
                    onChange={(e) => setPeerId(e.target.value)}
                    className="w-full p-2 border rounded-lg"
                />
                <button
                    onClick={() => connectToStream(peerId)}
                    className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-xl"
                >
                    Connect
                </button>
            </div>

            {remoteStream && (
                <audio
                    controls
                    autoPlay
                    ref={(audio) => {
                        if (audio) {
                            audio.srcObject = remoteStream;
                        }
                    }}
                />
            )}
        </div>
    );
};

export default MicStreamer;
