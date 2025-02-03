import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import Listener from './Listener';

const container = document.getElementById('root');

if (container) {
    const root = createRoot(container);

    const urlParams = new URLSearchParams(window.location.search);
    const peerId = urlParams.get('peerId');

    // Load listener if peerId exists, otherwise load the streamer
    if (peerId) {
        root.render(<Listener />);
    } else {
        root.render(<App />);
    }
}
