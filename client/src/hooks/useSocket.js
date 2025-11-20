// client/src/hooks/useSocket.js
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SOCKET_SERVER_URL = "http://localhost:5000";

const useSocket = () => {
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        const newSocket = io(SOCKET_SERVER_URL);
        setSocket(newSocket);

        newSocket.on('connect', () => {
            setIsConnected(true);
            console.log("Client connected to server!");
        });

        newSocket.on('disconnect', () => {
            setIsConnected(false);
            console.log("Client disconnected from server.");
        });

        // Cleanup function
        return () => {
            newSocket.disconnect();
        };
    }, []); // Run only once

    return { socket, isConnected };
};

export default useSocket;
