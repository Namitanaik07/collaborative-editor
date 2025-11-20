// client/src/components/CodeEditorPage.jsx 

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useLocation } from "react-router-dom";
import useSocket from "../hooks/useSocket";
import CodeEditor from "./Editor";
import FileExplorer from "./FileExplorer";
import debounce from "lodash.debounce"; 


const initialCode = `function hello() {
// Start coding here!
console.log("Welcome to the collaborative editor.");
}`;

const TYPING_TIMEOUT = 500;

function CodeEditorPage() {
    const { roomId } = useParams();
    const location = useLocation();
    const username = location.state?.username || "Guest";

    // --- State Management ---
    const [files, setFiles] = useState([{ name: 'index.js', content: initialCode, language: 'javascript' }]);
    const [currentFile, setCurrentFile] = useState('index.js');
    const { isConnected, socket } = useSocket();
    const activeFile = files.find(f => f.name === currentFile) || files[0];
    const [code, setCode] = useState(activeFile.content);
    const [language, setLanguage] = useState(activeFile.language);
    const [message, setMessage] = useState(`Room ID: ${roomId}`);
    
    // Day 13/9/10 States
    const [messages, setMessages] = useState([]);
    const [messageInput, setMessageInput] = useState('');
    const [activeUsers, setActiveUsers] = useState([]);
    const [typingUsers, setTypingUsers] = useState(new Set());
    const [remoteCursors, setRemoteCursors] = useState({}); 

    const chatMessagesRef = useRef(null); // Ref for auto-scrolling chat
    
    // -------------------------------------------------------------------
    // DAY 14: FILE OPERATION HANDLERS
    // -------------------------------------------------------------------
    const createFile = () => {
        const fileName = prompt("Enter new file name (e.g., component.js):");
        if (fileName && fileName.trim()) {
            // NOTE: Server handles persistence and broadcast
            socket.emit('create-file', { roomId, fileName: fileName.trim() });
        }
    };

    const deleteFile = (fileName) => {
        // Safety checks: Cannot delete index.js or the last file in the list
        if (fileName === 'index.js' && files.length === 1) {
             alert("Cannot delete the only file in the project.");
             return;
        }

        if (window.confirm(`Are you sure you want to delete ${fileName}?`)) {
            //server handles persistence n broadcast
            socket.emit('delete-file', { roomId, fileName });
        }
    };
    
    // -------------------------------------------------------------------
    // utility fnctsss
    // -------------------------------------------------------------------
    const sendStoppedTyping = (sock, room, user) => {
        if (sock) {
            sock.emit("stopped-typing", { roomId: room, username: user });
        }
    };

    const debouncedStoppedTyping = useCallback(
        debounce(sendStoppedTyping, TYPING_TIMEOUT),
        [TYPING_TIMEOUT]
    );

    const handleSendMessage = (e) => {
        e.preventDefault(); 
        if (messageInput.trim() === '' || !socket) return;
        const messageData = { roomId, username, text: messageInput.trim(), timestamp: new Date().toISOString() };
        socket.emit('send-message', messageData);
        setMessageInput('');
    };
    
    const handleLanguageChange = (e) => {
        const newLanguage = e.target.value;
        setLanguage(newLanguage);
        if (socket) {
            socket.emit('language-change', { roomId, language: newLanguage });
        }
    };
    
    const switchFile = (fileName) => {
        if (fileName === currentFile) return;
        setFiles(prevFiles => prevFiles.map(f => 
            f.name === currentFile ? { ...f, content: code } : f
        ));
        setCurrentFile(fileName);
    };

    const handleCodeChange = (newCode) => {
        setCode(newCode);
        if (socket) {
            socket.emit("code-change", { roomId, fileName: currentFile, code: newCode });
            socket.emit("typing", { roomId, username });
            debouncedStoppedTyping(socket, roomId, username);
        }
    };

    // -------------------------------------------------------------------
    // EFFECTS
    // -------------------------------------------------------------------
    
    // Efct 1: Update code/language when currentFile changes
    useEffect(() => {
        const newActiveFile = files.find(f => f.name === currentFile);
        if (newActiveFile) {
            setCode(newActiveFile.content);
            setLanguage(newActiveFile.language);
        }
    }, [currentFile, files]);

// Efct 3: Auto-scroll chat to the bottom on new message
useEffect(() => {
    if (chatMessagesRef.current) {
        chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
}, [messages]); // Runs whenever a new message is received


    // Effect 3: Socket Listeners Setup
    useEffect(() => {
        if (!socket || !isConnected) return;

        socket.emit("join-room", { roomId, username });

        // --- Handlers (Definition) ---
        const handleUserJoined = (msg) => { setMessage(msg); };
        const handleRoomJoined = (msg) => { setMessage(msg); };
        const handleUserLeft = (msg) => { setMessage(msg); console.log(msg); };
        const handleRoomUsers = (users) => { setActiveUsers(users); };
        const handleInitialLoad = ({ files: initialFiles, currentFile: initialCurrentFile }) => {
            if (initialFiles && initialFiles.length > 0) {
                setFiles(initialFiles);
                setCurrentFile(initialCurrentFile);
                const initialActive = initialFiles.find(f => f.name === initialCurrentFile);
                if (initialActive) {
                    setCode(initialActive.content);
                    setLanguage(initialActive.language);
                }
            }
        };
        const handleDbError=(errormessage)=>
        {
            console.log("Db Error: ",errormessage);
            alert('save error:'+errormessage);
            setMessage('Error:'+errormessage);
        }
        const receiveCodeHandler = ({ fileName, code: newCode }) => {
            if (fileName === currentFile) {
                setCode(newCode);
            }
            setFiles(prevFiles => prevFiles.map(f => f.name === fileName ? { ...f, content: newCode } : f));
        };
        const handleUserTyping = ({ username: typingUsername }) => { setTypingUsers((prev) => new Set(prev).add(typingUsername)); };
        // client/src/components/CodeEditorPage.jsx (Corrected line)
const handleUserStoppedTyping = ({ username: stoppedUsername }) => { setTypingUsers((prev) => { const newSet = new Set(prev); newSet.delete(stoppedUsername); return newSet; }); };
//                               ^--- CORRECT
        const handleRemoteCursorChange = ({ username: remoteUser, position }) => { if (remoteUser !== username) { setRemoteCursors((prev) => ({ ...prev, [remoteUser]: position, })); } };
        const handleLanguageChangeFromServer = (newLanguage) => { setLanguage(newLanguage); console.log(`Language switched to: ${newLanguage}`); };
        const handleReceiveMessage = (messageData) => { setMessages(prevMessages => [...prevMessages, messageData]); };
        
        //  DAY 14: File List Update Handler
        const handleFileListUpdate = ({ files: newFiles, currentFile: newCurrentFile }) => {
            setFiles(newFiles);
            setCurrentFile(newCurrentFile);
            setMessage(`Project files updated. Switched to ${newCurrentFile}`);
        };


        //Set up listeners

        socket.on('load-initial-code', handleInitialLoad);
        socket.on("code-change-from-server", receiveCodeHandler);
        socket.on("user-joined", handleUserJoined);
        socket.on("room-joined", handleRoomJoined);
        socket.on("user-left", handleUserLeft);
        socket.on("room-users", handleRoomUsers);
        socket.on("user-typing", handleUserTyping);
        socket.on("user-stopped-typing", handleUserStoppedTyping);
        socket.on("remote-cursor-change", handleRemoteCursorChange);
        socket.on('language-change-from-server', handleLanguageChangeFromServer);
        socket.on('receive-message', handleReceiveMessage);
        socket.on('file-list-update', handleFileListUpdate); 
        socket.on('db-error', handleDbError);


        // --- Cleanup function ---
        return () => {
            socket.off('load-initial-code', handleInitialLoad);
            socket.off("code-change-from-server", receiveCodeHandler);
            socket.off("user-joined", handleUserJoined);
            socket.off("room-joined", handleRoomJoined);
            socket.off("user-left", handleUserLeft);
            socket.off("room-users", handleRoomUsers);
            socket.off("user-typing", handleUserTyping);
            socket.off("user-stopped-typing", handleUserStoppedTyping);
            socket.off("remote-cursor-change", handleRemoteCursorChange);
            socket.off('language-change-from-server', handleLanguageChangeFromServer);
            socket.off('receive-message', handleReceiveMessage);
            socket.off('db-error', handleDbError);
            socket.off('file-list-update', handleFileListUpdate); // file list
        };
        
    }, [socket, isConnected, roomId, username, debouncedStoppedTyping, currentFile]);


    // Helper to format the list of typing users (excluding yourself)
    const typingMessage = Array.from(typingUsers)
        .filter((user) => user !== username)
        .join(", ");

    // -------------------------------------------------------------------
    // RENDER
    // -------------------------------------------------------------------
    return (
        <div className="App" style={{ padding: "20px" }}>
            <header>
                <h1>Code Room: **{roomId}**</h1>
                <p>User: **{username}** | Status: **{isConnected ? "🟢 Connected" : "🔴 Disconnected"}**</p>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <div style={{ padding: "10px", backgroundColor: "#44c635ff", borderRadius: '4px' }}>
                        **Notification:** {message}
                    </div>

                    {/* Language Selector */}
                    <div>
                        <label htmlFor="language-select" style={{ marginRight: '10px', color: '#333' }}>Language:</label>
                        <select id="language-select" value={language} onChange={handleLanguageChange} style={{ padding: '5px', borderRadius: '4px' }}>
                            <option value="javascript">JavaScript</option>
                            <option value="python">Python</option>
                            <option value="typescript">TypeScript</option>
                            <option value="html">HTML</option>
                            <option value="css">CSS</option>
                        </select>
                    </div>
                </div>

                {/* Typing Indicator */}
                {typingMessage.length > 0 && (
                    <div style={{ color: "#007bff", fontStyle: "italic", marginBottom: "10px" }}>
                        {typingMessage} {typingUsers.size > 1 ? "are" : "is"} typing...
                    </div>
                )}
            </header>

            {/* Main Flex Container for File Explorer, Editor, and Chat/User List */}
            <div style={{ display: "flex", height: "80vh", backgroundColor: '#2e2e2e', border: '1px solid #444', borderRadius: '8px', overflow: 'hidden' }}>

                {/* 1.. File Explorer (Left Sidebar) */}
                <FileExplorer 
                    files={files}
                    currentFile={currentFile}
                    onSwitchFile={switchFile}
                    onCreateFile={createFile} //  DAY 14 
                    onDeleteFile={deleteFile} 
                />

                {/* 2.. Editor and User/Chat Container */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>

                    {/* Tab Bar / Active File Display */}
                    <div style={{ padding: '5px 15px', borderBottom: '1px solid #444', backgroundColor: '#3c3c3c', color: 'white' }}>
                        Active File: **{currentFile}**
                    </div>

                    <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                        
                        {/* Editor Area */}
                        <div style={{ flex: 3, padding: '0px', overflow: 'hidden' }}>
                            <CodeEditor
                                code={code}
                                language={language}
                                onChange={handleCodeChange}
                                socket={socket}
                                roomId={roomId}
                                username={username}
                                remoteCursors={remoteCursors}
                            />
                        </div>

                        {/* User/Chat Sidebar (Right) */}
                        <div style={{ flex: 1, padding: '10px', borderLeft: '1px solid #444', backgroundColor: '#222', color: 'white', display: 'flex', flexDirection: 'column' }}>

                            {/* User List Section */}
                            <div style={{ flex: '0 0 auto', paddingBottom: '10px', borderBottom: '1px solid #444' }}>
                                <h2>Active Users ({activeUsers.length})</h2>
                                <ul style={{ listStyle: 'none', padding: 0 }}>
                                    {activeUsers.map((user, index) => (
                                        <li key={index} style={{ padding: '4px 0', borderBottom: '1px dotted #444', fontWeight: user === username ? 'bold' : 'normal' }}>
                                            {user === username ? '🟢' : '🟡'} {user} {user === username && '(You)'}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* CHAT SECTION */}
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', paddingTop: '10px' }}>
                                <h3>Room Chat</h3>
                                
                                {/* Message Display Area */}
                                <div ref={chatMessagesRef} id="chat-messages" style={{ flex: 1, overflowY: 'auto', paddingRight: '5px' }}>
                                    {messages.map((msg, index) => (
                                        <div key={index} style={{ marginBottom: '8px', textAlign: msg.username === username ? 'right' : 'left' }}>
                                            <span style={{ fontWeight: 'bold', color: msg.username === username ? '#00ccff' : '#00ff73', fontSize: '0.85em' }}>
                                                {msg.username === username ? 'You' : msg.username}:
                                            </span>
                                            <p style={{ margin: '0', fontSize: '0.9em', wordBreak: 'break-word', backgroundColor: msg.username === username ? '#3a3a3a' : '#4a4a4a', padding: '4px', borderRadius: '5px', display: 'inline-block', maxWidth: '95%' }}>
                                                {msg.text}
                                            </p>
                                        </div>
                                    ))}
                                </div>

                                {/* Message Input Form */}
                                <form onSubmit={handleSendMessage} style={{ paddingTop: '10px', borderTop: '1px solid #444' }}>
                                    <input
                                        type="text"
                                        value={messageInput}
                                        onChange={(e) => setMessageInput(e.target.value)}
                                        placeholder="Type a message..."
                                        style={{ width: 'calc(100% - 60px)', padding: '8px', border: 'none', borderRadius: '4px', backgroundColor: '#3c3c3c', color: 'white' }}
                                    />
                                    <button type="submit" style={{ width: '50px', padding: '8px', marginLeft: '5px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                                        Send
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CodeEditorPage;