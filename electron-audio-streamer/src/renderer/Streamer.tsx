import React, { useRef, useState, useEffect } from 'react';
import Peer from 'peerjs';

// Default optimized audio constraints
const defaultAudioConstraints = {
    sampleRate: 48000,
    channelCount: 2,
    echoCancellation: false,
    noiseSuppression: false,
    autoGainControl: false
};

const Streamer: React.FC = () => {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
    const [systemAudioDeviceId, setSystemAudioDeviceId] = useState<string | null>(null);
    const [peerId, setPeerId] = useState<string | null>(null);
    const [volume, setVolume] = useState<number>(1);
    const [isMuted, setIsMuted] = useState<boolean>(false);
    const [isStreaming, setIsStreaming] = useState<boolean>(false);  // Streaming state

    // Dynamic audio constraint states
    const [audioConstraints, setAudioConstraints] = useState(defaultAudioConstraints);

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
            if (!systemAudioDeviceId) {
                throw new Error('Please select a system audio device.');
            }

            // Stop existing stream if restarting
            if (audioRef.current && audioRef.current.srcObject) {
                const tracks = (audioRef.current.srcObject as MediaStream).getTracks();
                tracks.forEach(track => track.stop());
            }

            // Capture system audio with current constraints
            const systemAudioStream = await navigator.mediaDevices.getUserMedia({
                audio: { deviceId: systemAudioDeviceId, ...audioConstraints }
            });
            console.log('System audio stream captured with constraints:', audioConstraints);

            // Play system audio locally
            if (audioRef.current) {
                audioRef.current.srcObject = systemAudioStream;
                audioRef.current.volume = volume;
                audioRef.current.muted = isMuted;
                await audioRef.current.play();
                console.log('Playing system audio.');

                // Initialize VU Meter Visualization
                initializeVUMeter(systemAudioStream);
            }

            setIsStreaming(true);  // Set streaming state


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

            setPeerId(peer.id);
            peer.on('open', (id) => {
                console.log(`Streamer Peer ID: ${id}`);
                // Share this link with listeners:
                console.log(`Auto-connect link: http://127.0.0.1:3000/#/listener?peerId=${id}`);  // Update to point to your listener web app
            });

            peer.on('call', (call) => {
                console.log(`Incoming call from listener: ${call.peer}`);
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
                if (systemAudioStream) {
                    console.log('Answering call with system audio stream.');
                    call.answer(systemAudioStream);  // Send the system audio stream to the listener

                    // Handle ICE candidates from the listener
                    call.peerConnection?.addEventListener('icecandidate', (event) => {
                        if (event.candidate) {
                            console.log('Streamer ICE candidate:', event.candidate);
                        }
                    });

                    call.on('error', (err) => {
                        console.error('Error during streaming to listener:', err);
                    });
                } else {
                    console.error('System audio stream not available. Cannot answer call.');
                }
            });



        } catch (err) {
            console.error('Failed to capture or stream audio:', err);
        }
    };

    const handleStopStreaming = () => {
        if (audioRef.current && audioRef.current.srcObject) {
            const tracks = (audioRef.current.srcObject as MediaStream).getTracks();
            tracks.forEach(track => track.stop());
        }
        setIsStreaming(false);
        console.log('Streaming stopped.');
    };

    // Handle volume change
    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVolume = parseFloat(e.target.value);
        setVolume(newVolume);
        if (audioRef.current) {
            audioRef.current.volume = newVolume;
        }
    };

    // Toggle mute
    const toggleMute = () => {
        setIsMuted(prevMuted => {
            if (audioRef.current) {
                audioRef.current.muted = !prevMuted;
            }
            return !prevMuted;
        });
    };

    // Toggle basic audio constraints
    const toggleConstraint = (constraintName: keyof typeof defaultAudioConstraints) => {
        if (!isStreaming) {
            setAudioConstraints(prevConstraints => ({
                ...prevConstraints,
                [constraintName]: !prevConstraints[constraintName]
            }));
        }
    };

    // Handle advanced settings
    const handleAdvancedSettingChange = (key: keyof typeof defaultAudioConstraints, value: number) => {
        if (!isStreaming) {
            setAudioConstraints(prevConstraints => ({
                ...prevConstraints,
                [key]: value
            }));
        }
    };


    // Initialize the VU Meter using Web Audio API
    const initializeVUMeter = (stream: MediaStream) => {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;  // Determines the resolution
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

                canvasContext.fillStyle = `rgb(${barHeight + 100},255,255)`;  // Red bars with intensity based on volume
                canvasContext.fillRect(x, canvas.height - barHeight / 2, barWidth, barHeight / 2);

                x += barWidth + 1;
            }

            requestAnimationFrame(draw);
        };

        draw();  // Start drawing
    };

    return (
        <div style={{ textAlign: 'center', padding: '20px' }}>
            <h1>Advanced System Audio Streamer</h1>

            {/* System Audio Device Selection */}
            <div style={{ marginTop: '10px' }}>
                <label>Select System Audio Input:</label>
                <select
                    onChange={(e) => setSystemAudioDeviceId(e.target.value)}
                    defaultValue=""
                    disabled={isStreaming}  // Lock device selection while streaming
                >
                    <option value="" disabled>Select system audio device</option>
                    {devices.map(device => (
                        <option key={device.deviceId} value={device.deviceId}>
                            {device.label || `Audio Input ${device.deviceId}`}
                        </option>
                    ))}
                </select>
            </div>

            {/* Audio Processing Settings */}
            <div style={{ marginTop: '20px' }}>
                <h3>Audio Processing Settings:</h3>
                <label>
                    <input
                        type="checkbox"
                        checked={audioConstraints.echoCancellation}
                        onChange={() => toggleConstraint('echoCancellation')}
                        disabled={isStreaming}  // Lock while streaming
                    />
                    Echo Cancellation
                </label>
                <br />
                <label>
                    <input
                        type="checkbox"
                        checked={audioConstraints.noiseSuppression}
                        onChange={() => toggleConstraint('noiseSuppression')}
                        disabled={isStreaming}  // Lock while streaming
                    />
                    Noise Suppression
                </label>
                <br />
                <label>
                    <input
                        type="checkbox"
                        checked={audioConstraints.autoGainControl}
                        onChange={() => toggleConstraint('autoGainControl')}
                        disabled={isStreaming}  // Lock while streaming
                    />
                    Auto Gain Control
                </label>
            </div>

            {/* Advanced Audio Settings */}
            <div style={{ marginTop: '20px' }}>
                <h3>Advanced Settings:</h3>
                <label>
                    Sample Rate:
                    <select
                        value={audioConstraints.sampleRate}
                        onChange={(e) => handleAdvancedSettingChange('sampleRate', parseInt(e.target.value))}
                        disabled={isStreaming}  // Lock while streaming
                    >
                        <option value={44100}>44.1 kHz</option>
                        <option value={48000}>48 kHz</option>
                        <option value={96000}>96 kHz</option>
                    </select>
                </label>
                <br />
                <label>
                    Channel Count:
                    <select
                        value={audioConstraints.channelCount}
                        onChange={(e) => handleAdvancedSettingChange('channelCount', parseInt(e.target.value))}
                        disabled={isStreaming}  // Lock while streaming
                    >
                        <option value={1}>Mono</option>
                        <option value={2}>Stereo</option>
                    </select>
                </label>
            </div>

            {/* Start/Stop Streaming Buttons */}
            <div style={{ marginTop: '20px' }}>
                {!isStreaming ? (
                    <button onClick={handleStartStreaming} disabled={isStreaming}>
                        Start Streaming Audio
                    </button>
                ) : (
                    <button onClick={handleStopStreaming}>
                        Stop Streaming
                    </button>
                )}
            </div>
            {/* VU Meter Canvas */}
            <div style={{ marginTop: '20px' }}>
                <canvas ref={canvasRef} width="400" height="100" style={{ border: '1px solid #ccc' }} />
            </div>
            {/* Volume Control */}
            <div style={{ marginTop: '20px' }}>
                <label>Volume:</label>
                <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={volume}
                    onChange={handleVolumeChange}
                    style={{ width: '80%' }}
                />
                <span>{Math.round(volume * 100)}%</span>
            </div>

            {/* Mute/Unmute Button */}
            <div style={{ marginTop: '10px' }}>
                <button onClick={toggleMute}>
                    {isMuted ? 'Unmute' : 'Mute'}
                </button>
            </div>

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

export default Streamer;
