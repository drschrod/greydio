import React, { useState, useRef } from 'react';
import Peer from 'simple-peer';

const MicStreamer: React.FC = () => {
    const [isStreaming, setIsStreaming] = useState(false);
    const [peerId, setPeerId] = useState('');
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
    const peerRef = useRef<Peer.Instance | null>(null);

    const startStreaming = async () => {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

        const peer = new Peer({
            initiator: true,
            trickle: false,
            stream,
        });

        peer.on('signal', (data) => {
            setPeerId(JSON.stringify(data));
        });

        peerRef.current = peer;
        setIsStreaming(true);
    };

    const connectToStream = (signalData: string) => {
        const peer = new Peer({
            initiator: false,
            trickle: false,
        });

        peer.on('signal', (data) => {
            console.log('Listener signal:', data);
        });

        peer.on('stream', (stream) => {
            setRemoteStream(stream);
        });

        peer.signal(JSON.parse(signalData));
        peerRef.current = peer;
    };

    return (
        <div className="flex flex-col items-center justify-center h-screen space-y-4">
            <h1 className="text-2xl font-bold">Decentralized Mic Streamer</h1>

            {!isStreaming ? (
                <button onClick={startStreaming} className="px-4 py-2 bg-green-500 text-white rounded-xl">
                    Start Streaming
                </button>
            ) : (
                <div className="w-full max-w-md">
                    <h2 className="text-xl font-semibold">Share this with listeners:</h2>
                    <textarea
                        value={peerId}
                        readOnly
                        className="w-full h-32 p-2 border rounded-lg"
                    />
                </div>
            )}

            <div className="w-full max-w-md space-y-2">
                <h2 className="text-xl font-semibold">Join a Stream:</h2>
                <textarea
                    placeholder="Paste the streamer's ID here"
                    onChange={(e) => setPeerId(e.target.value)}
                    className="w-full h-32 p-2 border rounded-lg"
                />
                <button
                    onClick={() => connectToStream(peerId)}
                    className="px-4 py-2 bg-blue-500 text-white rounded-xl"
                >
                    Connect
                </button>
            </div>

            {remoteStream && (
                <audio
                    controls
                    autoPlay
                    ref={(audio) => {
                        if (audio && remoteStream) {
                            audio.srcObject = remoteStream;
                        }
                    }}
                />
            )}
        </div>
    );
};

export default MicStreamer;
