// server/server.js (Final Consolidated Code)

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

const userSocketMap = new Map(); // Maps socket.id -> username & roomId
const roomUsersMap = new Map();  // Maps roomId -> Set of usernames

// ----------------------------------------------------
// 1. MONGODB CONNECTION & SCHEMA
// ----------------------------------------------------
mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 30000, 
    socketTimeoutMS: 45000,          
})
    .then(() => console.log('MongoDB Connected Successfully!'))
    .catch(err => console.error('MongoDB Connection Error:', err));

const CodeProjectSchema = new mongoose.Schema({
    roomId: { type: String, required: true, unique: true },
    // Array to hold all project files
    files: [{
        name: { type: String, required: true },
        content: { type: String, default: "" },
        language: { type: String, default: "javascript" },
        _id: false // Prevents Mongoose from auto-generating IDs for subdocuments
    }],
    currentFile: { type: String, default: "index.js" }, // Track the active file
    // createdAt: { type: Date, default: Date.now }, // (Optional: Keep or remove this line)
});

const CodeProject = mongoose.model('CodeProject', CodeProjectSchema);


// ----------------------------------------------------
// 2. UTILITY FUNCTIONS
// ----------------------------------------------------
const initialCode = `function hello() {
// Start coding here!
console.log("Welcome to the collaborative editor.");
}`;

async function findOrCreateProject(roomId) {
    const DEFAULT_FILE = {
    name: "index.js",
    content: initialCode, // Use the existing initialCode constant
    language: "javascript"
};
    if (roomId === null) return; 
    try {
        const project = await CodeProject.findOneAndUpdate(
            { roomId },
            { $setOnInsert: { 
    files: [DEFAULT_FILE], // store as an array
    currentFile: DEFAULT_FILE.name,
    roomId: roomId 
}},
            { upsert: true, new: true } 
        );
        return project; 
    } catch (error) {
        console.error("[DB FIND/CREATE FAILURE] Error:", error);
        return { code: initialCode, language: 'javascript' }; 
    }
}

async function saveCode(roomId, fileName, code) { // ADD fileName ARGUMENT
    try {
        await CodeProject.findOneAndUpdate(
            { roomId, "files.name": fileName }, // Find the project AND the specific file
            { $set: { "files.$.content": code } } // $ sets the content of the found array element
        );
        console.log(`[DB SAVE SUCCESS] Code saved for file ${fileName} in room: ${roomId}`);
    } catch (error) {
        console.error("[DB SAVE FAILURE] Error saving code:", error);
    }
}

function broadcastUserList(io, roomId) {
    const users = Array.from(roomUsersMap.get(roomId) || []);
    io.to(roomId).emit('room-users', users);
    console.log(`[PRESENCE] Room ${roomId} users: ${users.length}`);
}
// ----------------------------------------------------


// ----------------------------------------------------
// 3. SOCKET.IO CONFIGURATION
// ----------------------------------------------------
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173", 
        methods: ["GET", "POST"]
    }
});
// ----------------------------------------------------


// ----------------------------------------------------
// 4. SOCKET.IO CONNECTION HANDLING
// ----------------------------------------------------
io.on('connection', (socket) => {
    console.log(`[SOCKET CONNECTED] ID: ${socket.id}`);

    // --- DAY 4/7/8: Room Joining Logic ---
    socket.on("join-room", async ({ roomId, username }) => {
      socket.join(roomId);
      console.log(`[ROOM JOINED] User: ${username} joined Room ID: ${roomId}`);

      const project = await findOrCreateProject(roomId);
      // Send both the code AND the language found in the database
      socket.emit("load-initial-code", {
        code: project.code,
        language: project.language, // Pass language from DB
      });

      // User tracking and broadcast
      userSocketMap.set(socket.id, { username, roomId });
      let users = roomUsersMap.get(roomId);
      if (!users) {
        users = new Set();
        roomUsersMap.set(roomId, users);
      }
      users.add(username);
      socket.to(roomId).emit("user-joined", `${username} has joined the room.`);
      socket.emit("room-joined", `Welcome to room ${roomId}.`);
      broadcastUserList(io, roomId);
    });
    // server/server.js (Inside io.on('connection', ...))

// --- DAY 13: Chat Logic ---
socket.on('send-message', (messageData) => {
    // Broadcast the message to all clients in the same room, including the sender
    io.to(messageData.roomId).emit('receive-message', messageData);
    console.log(`[CHAT] Room ${messageData.roomId} - ${messageData.username}: ${messageData.text.substring(0, 30)}...`);

    // NOTE: If you implement persistence, save messageData to DB here.
});
    
    // --- DAY 9: Typing Logic (Start and Stop) ---
    socket.on('typing', ({ roomId, username }) => {
        // Broadcast that a specific user STARTED typing
        socket.to(roomId).emit('user-typing', { username });
        console.log(`[TYPING START] ${username} is typing in room ${roomId}`);
    });
    // --- DAY 10: Cursor Logic ---
socket.on('cursor-change', (data) => {
    console.log(`[DEBUG SERVER] Received cursor from ${data.username} in room ${data.roomId}`);
    // Broadcast the cursor position to all others in the room
    socket.to(data.roomId).emit('remote-cursor-change', {
        username: data.username,
        position: data.position
    });
});
// --- DAY 14: File Operations ---
socket.on('create-file', async ({ roomId, fileName }) => {
    const newFile = {
        name: fileName,
        content: initialCode, // Use initialCode constant
        language: 'javascript'
    };

    try {
        await CodeProject.findOneAndUpdate(
            { roomId },
            { $push: { files: newFile } } // Add the new file to the array
        );

        // Fetch the updated project to send the complete file list
        const updatedProject = await CodeProject.findOne({ roomId });

        // Broadcast the new file list and set the new file as current for all
        io.to(roomId).emit('file-list-update', { 
            files: updatedProject.files, 
            currentFile: fileName 
        });
        console.log(`[FILE] Created file: ${fileName} in room ${roomId}`);
    } catch (error) {
        console.error("[FILE ERROR] Failed to create file:", error);
        socket.emit('db-error', `Failed to create file: ${error.message}`); // Send error back
    }
});
// server/server.js (Inside io.on('connection', (socket) => { ... });)

socket.on('delete-file', async ({ roomId, fileName }) => {
    try {
        await CodeProject.findOneAndUpdate(
            { roomId },
            { $pull: { files: { name: fileName } } } // Remove file from array
        );

        // Fetch the updated project
        const updatedProject = await CodeProject.findOne({ roomId });

        // Determine the new active file (default to the first file left, or 'index.js')
        const newCurrentFile = updatedProject.files[0] ? updatedProject.files[0].name : 'index.js';

        // Broadcast the new file list and the new current file
        io.to(roomId).emit('file-list-update', { 
            files: updatedProject.files, 
            currentFile: newCurrentFile 
        });
        console.log(`[FILE] Deleted file: ${fileName} from room ${roomId}`);
    } catch (error) {
        console.error("[FILE ERROR] Failed to delete file:", error);
        socket.emit('db-error', `Failed to delete file: ${error.message}`);
    }
});
//DAY 11: Language Change Logic 
socket.on('language-change', async ({ roomId, language }) => { // Add async for DB save below
    // Save the language to the database (Step 4)
    await CodeProject.findOneAndUpdate({ roomId }, { language });

    // Broadcast the change to all OTHER users
    socket.to(roomId).emit('language-change-from-server', language);
});

    socket.on('stopped-typing', ({ roomId, username }) => {
        //Broadcast that a specific user STOPPED typing
        socket.to(roomId).emit('user-stopped-typing', { username });
        console.log(`[TYPING STOP] ${username} stopped typing in room ${roomId}`);
    });


    // DAY 5/7: Real-Time Code Sync Logic 
    socket.on('code-change', ({ roomId, code }) => {
        saveCode(roomId, code); 
        console.log(`[CODE SYNC] Room: ${roomId}, Code Length: ${code.length}`); 
        socket.to(roomId).emit('code-change-from-server', code);
    });


    //DAY 8: Disconnect Logic 
    socket.on('disconnect', () => {
        const userData = userSocketMap.get(socket.id);
        if (userData) {
            const { username, roomId } = userData;

            userSocketMap.delete(socket.id);
            if (roomUsersMap.has(roomId)) {
                roomUsersMap.get(roomId).delete(username);
                broadcastUserList(io, roomId);
            }
            console.log(`[DISCONNECTED] User: ${username}`);
            socket.to(roomId).emit('user-left', `${username} has left the room.`);
        }
    });
});
// ----------------------------------------------------


// Basic health check route
app.get('/', (req, res) => {
    res.send('Collaborative Editor Server Running');
});

// Start the server
server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});