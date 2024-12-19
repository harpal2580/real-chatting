const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(express.static('public'));

const users = new Set();
const userSocketMap = new Map();
const roomUsers = new Map();

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Join Room Handler
    socket.on('join-room', (data) => {
        console.log('Join room request:', data);
        const { username, emojiUsername, room } = data;

        if (users.has(username)) {
            socket.emit('username-taken');
            return;
        }

        // Join room
        socket.join(room);
        users.add(username);
        userSocketMap.set(socket.id, { username, emojiUsername, room });

        // Track room users
        if (!roomUsers.has(room)) {
            roomUsers.set(room, new Set());
        }
        roomUsers.get(room).add(username);

        console.log(`${username} joined room ${room}`);

        // Emit success to the user who joined
        socket.emit('join-success', { username, emojiUsername });

        // Broadcast to others in the room
        socket.to(room).emit('user-joined', { username, emojiUsername });
    });

    // Message Handler
    socket.on('new-message', (data) => {
        console.log('New message received:', data); // Debug log
        
        // Broadcast message to ALL users in the room (including sender)
        io.to(data.room).emit('receive-message', {
            username: data.username,
            emojiUsername: data.emojiUsername,
            message: data.message
        });
    });

    // Disconnect Handler
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        const userData = userSocketMap.get(socket.id);
        if (userData) {
            const { username, emojiUsername, room } = userData;
            
            users.delete(username);
            userSocketMap.delete(socket.id);
            
            if (roomUsers.has(room)) {
                roomUsers.get(room).delete(username);
                
                // Notify room of user leaving
                io.to(room).emit('user-left', { username, emojiUsername });
                
                if (roomUsers.get(room).size === 0) {
                    roomUsers.delete(room);
                }
            }
        }
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});