import React from 'react';

const App: React.FC = () => {
    return (
        <div style={{ textAlign: 'center', padding: '20px' }}>
            <h1>Electron System Audio Streamer</h1>
            <button onClick={() => window.electronAPI.startStreaming()}>
                Start Streaming System Audio
            </button>
        </div>
    );
};

export default App;
