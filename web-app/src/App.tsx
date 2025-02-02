import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import MicStreamer from './MicStreamer';

const Home: React.FC = () => (
  <div className="flex flex-col items-center justify-center h-screen space-y-4">
    <h1 className="text-4xl font-bold">Welcome to Greydio</h1>
    <p className="text-lg">Stream your mic or tune in to live sessions!</p>
    <Link to="/stream" className="px-4 py-2 bg-blue-500 text-white rounded-xl">
      Go to Stream
    </Link>
  </div>
);

const App: React.FC = () => {
  return (
    <Router>
      <nav className="w-full bg-gray-800 text-white p-4 flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold">Greydio</Link>
        <Link to="/" className="px-4 py-2 bg-blue-500 text-white rounded-xl">
          Home
        </Link>
      </nav>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/stream" element={<MicStreamer />} />
      </Routes>
    </Router>
  );
};

export default App;
