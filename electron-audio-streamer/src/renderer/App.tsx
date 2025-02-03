import React, { useRef, useState, useEffect } from 'react';
import Peer from 'peerjs';

const App: React.FC = () => {
    // Explicitly typing the ref as HTMLAudioElement
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
    const [micDeviceId, setMicDeviceId] = useState<string | null>(null);
    const [systemAudioDeviceId, setSystemAudioDeviceId] = useState<string | null>(null);
    const [peerId, setPeerId] = useState<string | null>(null);

    useEffect(() => {
        const fetchDevices = async () => {
            const allDevices = await navigator.mediaDevices.enumerateDevices();
            const audioInputDevices = allDevices.filter(device => device.kind === 'audioinput');
            setDevices(audioInputDevices);
        };

        fetchDevices();
    }, []);

    const handleStartStreaming = async () => {
        try {
            if (!micDeviceId || !systemAudioDeviceId) {
                throw new Error('Please select both mic and system audio devices.');
            }

            // Capture microphone audio
            const micStream = await navigator.mediaDevices.getUserMedia({
                audio: { deviceId: micDeviceId }
            });
            console.log('Microphone stream captured:', micStream.getAudioTracks());

            // Capture system audio (piped through as an input)
            const systemAudioStream = await navigator.mediaDevices.getUserMedia({
                audio: { deviceId: systemAudioDeviceId }
            });
            console.log('System audio stream captured:', systemAudioStream.getAudioTracks());

            // Test playing system audio alone
            if (audioRef.current) {
                audioRef.current.srcObject = systemAudioStream;  // TypeScript now recognizes this
                await audioRef.current.play();
                console.log('Playing system audio alone for verification.');
                return;  // Comment this out after verifying system audio works
            }

            // Combine mic and system audio tracks
            const combinedStream = new MediaStream([
                ...micStream.getAudioTracks(),
                ...systemAudioStream.getAudioTracks()
            ]);
            console.log('Combined audio tracks:', combinedStream.getAudioTracks());

            // Play combined audio locally
            if (audioRef.current) {
                audioRef.current.srcObject = combinedStream;
                await audioRef.current.play();
                console.log('Playing combined mic + system audio.');
            }

            // Initialize PeerJS and stream to listeners
            const peer = new Peer();
            peer.on('open', (id) => {
                console.log('Streaming Peer ID:', id);
                setPeerId(id);
            });

            peer.on('call', (call) => {
                console.log('Listener connected:', call.peer);
                call.answer(combinedStream);
            });

        } catch (err) {
            console.error('Failed to capture or stream audio:', err);
        }
    };

    return (
        <div style={{ textAlign: 'center', padding: '20px' }}>
            <h1>System Audio + Mic Streamer</h1>

            {/* Mic Device Selection */}
            <div>
                <label>Select Microphone:</label>
                <select onChange={(e) => setMicDeviceId(e.target.value)} defaultValue="">
                    <option value="" disabled>Select mic device</option>
                    {devices.map(device => (
                        <option key={device.deviceId} value={device.deviceId}>
                            {device.label || `Microphone ${device.deviceId}`}
                        </option>
                    ))}
                </select>
            </div>

            {/* System Audio Device Selection */}
            <div style={{ marginTop: '10px' }}>
                <label>Select System Audio Input:</label>
                <select onChange={(e) => setSystemAudioDeviceId(e.target.value)} defaultValue="">
                    <option value="" disabled>Select system audio device</option>
                    {devices.map(device => (
                        <option key={device.deviceId} value={device.deviceId}>
                            {device.label || `Audio Input ${device.deviceId}`}
                        </option>
                    ))}
                </select>
            </div>

            {/* Start Streaming Button */}
            <button onClick={handleStartStreaming} style={{ marginTop: '20px' }}>
                Start Streaming Audio
            </button>

            {/* Display PeerJS Share Link */}
            {peerId && (
                <div style={{ marginTop: '20px' }}>
                    <p>Share this link with listeners:</p>
                    <input
                        type="text"
                        value={`${window.location.origin}/?peerId=${peerId}`}
                        readOnly
                        style={{ width: '80%' }}
                    />
                </div>
            )}

            {/* Audio Player */}
            <audio ref={audioRef} controls autoPlay />
        </div>
    );
};

export default App;
