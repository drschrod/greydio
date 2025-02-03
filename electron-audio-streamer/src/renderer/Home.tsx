import React from 'react';
import { Link } from 'react-router-dom';

const Home: React.FC = () => {
    return (
        <div style={{ textAlign: 'center', padding: '20px' }}>
            <h1>Welcome to Greydio</h1>
            <p>Select an option below:</p>

            <div style={{ marginTop: '20px' }}>
                <Link to="/streamer">
                    <button style={{ marginRight: '10px' }}>Start Streaming</button>
                </Link>

                <Link to="/listener">
                    <button>Join a Stream</button>
                </Link>
            </div>
        </div>
    );
};

export default Home;
