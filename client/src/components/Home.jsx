// client/src/components/Home.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidV4 } from 'uuid'; // We need a UUID generator

// Install uuid: npm install uuid
// Note: If you haven't installed 'uuid', run the command above first!

function Home() {
    const navigate = useNavigate();
    const [roomId, setRoomId] = useState('');
    const [username, setUsername] = useState('');

    const createNewRoom = () => {
        // Generate a unique ID for a new room
        const id = uuidV4();
        setRoomId(id);
        console.log('New Room ID created:', id);
    };

    const handleJoinRoom = () => {
        if (!roomId || !username) {
            alert('Please enter a valid Room ID and Username.');
            return;
        }
        // Navigate to the editor room, passing the room ID and username as state
        // The room component will use the ID to connect and the username for presence
        navigate(`/room/${roomId}`, {
            state: { username: username }
        });
    };

    const handleEnter = (e) => {
        if (e.code === 'Enter') {
            handleJoinRoom();
        }
    };

    return (
        <div style={{ padding: '50px', maxWidth: '400px', margin: 'auto', textAlign: 'center' }}>
            <h2>Join or Create a Room</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '30px' }}>
                <input
                    type="text"
                    placeholder="Enter Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    style={{ padding: '10px', fontSize: '16px' }}
                />
                <input
                    type="text"
                    placeholder="Enter Room ID"
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value)}
                    onKeyUp={handleEnter}
                    style={{ padding: '10px', fontSize: '16px' }}
                />
                <button 
                    onClick={handleJoinRoom}
                    style={{ padding: '10px', fontSize: '16px', backgroundColor: '#007bff', color: 'white', border: 'none', cursor: 'pointer' }}
                >
                    Join Room
                </button>
                <p>
                    Or{' '}
                    <a 
                        onClick={createNewRoom} 
                        href="#"
                        style={{ color: '#007bff', cursor: 'pointer' }}
                    >
                        generate a new Room ID
                    </a>
                </p>
            </div>
        </div>
    );
}

export default Home;