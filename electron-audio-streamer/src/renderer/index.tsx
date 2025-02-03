import React from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './Home';
import Streamer from './Streamer';
import Listener from './Listener';

const container = document.getElementById('root');

if (container) {
    const root = createRoot(container);

    root.render(
        <Router>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/streamer" element={<Streamer />} />
                <Route path="/listener" element={<Listener />} />
            </Routes>
        </Router>
    );
}
