import React, { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Peer } from 'peerjs';
import { startStreaming } from './utils/startStreaming';
import { connectToStream } from './utils/connectToStream';
import { copyToClipboard } from './utils/copyToClipboard';

const MicStreamer: React.FC = () => {
    const [peerId, setPeerId] = useState('');
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
    const [copySuccess, setCopySuccess] = useState('');
    const [isStreaming, setIsStreaming] = useState(false);
    const [applyNoiseSuppression, setApplyNoiseSuppression] = useState(true);
    const [applyFilter, setApplyFilter] = useState(false);
    const [streamMic, setStreamMic] = useState(true);
    const [streamSystemAudio, setStreamSystemAudio] = useState(false);

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const peerRef = useRef<Peer | null>(null);
    const connRef = useRef<any>(null);
    const [searchParams] = useSearchParams();

    useEffect(() => {
        const autoConnectPeerId = searchParams.get('peerId');
        if (autoConnectPeerId) {
            connectToStream(autoConnectPeerId, setRemoteStream);
        }
    }, [searchParams]);

    useEffect(() => {
        if (remoteStream && audioRef.current) {
            audioRef.current.srcObject = remoteStream;
            audioRef.current.play().catch((err) => {
                console.error('Autoplay failed:', err);
            });
        }
    }, [remoteStream]);

    const handleStartStreaming = async () => {
        const audioTracks: MediaStreamTrack[] = [];

        if (streamMic) {
            const micStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: applyNoiseSuppression,
                    autoGainControl: true,
                },
            });
            audioTracks.push(...micStream.getAudioTracks());
        }

        if (streamSystemAudio) {
            try {
                const systemStream = await navigator.mediaDevices.getDisplayMedia({
                    video: false,
                    audio: true,
                });
                audioTracks.push(...systemStream.getAudioTracks());
            } catch (err) {
                console.error('System audio capture is not supported or permission denied:', err);
                alert('System audio capture is not supported by your browser or was denied. Please use Google Chrome and ensure you allow audio sharing.');
                return;  // Stop the streaming process if system audio fails
            }
        }

        if (audioTracks.length === 0) {
            alert('Please select at least one audio source to stream.');
            return;
        }

        // Combine mic and system audio tracks into one stream
        const combinedStream = new MediaStream(audioTracks);

        startStreaming(
            setPeerId,
            setIsStreaming,
            peerRef,
            connRef,
            applyNoiseSuppression,
            applyFilter,
            combinedStream
        );
    };


    return (
        <div className="flex flex-col items-center justify-center space-y-4 p-4">
            <h2 className="text-2xl font-bold">Mic & System Audio Streamer</h2>

            {!peerId ? (
                <div className="w-full max-w-md space-y-4">
                    <div className="flex items-center space-x-2">
                        <label className="text-lg">Noise Suppression:</label>
                        <input
                            type="checkbox"
                            checked={applyNoiseSuppression}
                            onChange={(e) => setApplyNoiseSuppression(e.target.checked)}
                            className="w-5 h-5"
                        />
                    </div>

                    <div className="flex items-center space-x-2">
                        <label className="text-lg">Low-pass Filter:</label>
                        <input
                            type="checkbox"
                            checked={applyFilter}
                            onChange={(e) => setApplyFilter(e.target.checked)}
                            className="w-5 h-5"
                        />
                    </div>

                    <div className="flex items-center space-x-2">
                        <label className="text-lg">Stream Mic Audio:</label>
                        <input
                            type="checkbox"
                            checked={streamMic}
                            onChange={(e) => setStreamMic(e.target.checked)}
                            className="w-5 h-5"
                        />
                    </div>

                    <div className="flex items-center space-x-2">
                        <label className="text-lg">Stream System Audio:</label>
                        <input
                            type="checkbox"
                            checked={streamSystemAudio}
                            onChange={(e) => setStreamSystemAudio(e.target.checked)}
                            className="w-5 h-5"
                        />
                    </div>

                    <button
                        onClick={handleStartStreaming}
                        className="px-4 py-2 bg-green-500 text-white rounded-xl"
                    >
                        Start Streaming
                    </button>
                </div>
            ) : (
                <div className="w-full max-w-md space-y-2">
                    <h3 className="text-lg font-semibold">Share this Link with Listeners:</h3>
                    <div className="flex items-center space-x-2">
                        <textarea
                            readOnly
                            value={`${window.location.origin}/stream?peerId=${peerId}`}
                            className="w-full h-12 p-2 border rounded-lg text-center"
                        />
                        <button
                            onClick={() => copyToClipboard(peerId, setCopySuccess)}
                            className="px-3 py-2 bg-blue-500 text-white rounded-lg"
                        >
                            Copy
                        </button>
                    </div>
                    {copySuccess && <p className="text-green-500">{copySuccess}</p>}
                </div>
            )}

            {!isStreaming && (
                <div className="w-full max-w-md mt-4 space-y-2">
                    <h3 className="text-lg font-semibold">Join a Stream:</h3>
                    <input
                        type="text"
                        placeholder="Enter DJ's Peer ID"
                        onChange={(e) => setPeerId(e.target.value)}
                        className="w-full p-2 border rounded-lg"
                    />
                    <button
                        onClick={() => connectToStream(peerId, setRemoteStream)}
                        className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-xl"
                    >
                        Connect
                    </button>
                </div>
            )}

            {remoteStream && (
                <audio ref={audioRef} autoPlay controls />
            )}
        </div>
    );
};

export default MicStreamer;
