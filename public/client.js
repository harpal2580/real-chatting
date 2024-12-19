const socket = io();

// DOM Elements
const loginScreen = document.getElementById('loginScreen');
const chatScreen = document.getElementById('chatScreen');
const loginForm = document.getElementById('loginForm');
const randomChatBtn = document.getElementById('randomChat');
const messageInput = document.getElementById('messageInput');
const sendMessageBtn = document.getElementById('sendMessage');
const messagesDiv = document.getElementById('messages');
const welcomeMessage = document.getElementById('welcomeMessage');
const messageSound = document.getElementById('messageSound');

const EMOJIS = [
    "😀", "😂", "😅", "😇", "😉", "😊", "😋", "😎", "😍", "😒",
    "😓", "😔", "😕", "😖", "😘", "😜", "😝", "😡", "😢", "😤",
    "😥", "😨", "😩", "😰", "😱", "😳", "😵", "😷", "🙃", "🙂",
    "🙄", "🤔", "🤨", "🤩", "🤪", "🤬", "🤯", "🥳", "🥺", "🧐",
    "🤖", "👻", "💀", "👽", "👾", "🎃", "😺", "😸", "😹", "😻",
    "😼", "😽", "🙀", "😿", "😾", "🙈", "🙉", "🙊", "🐵", "💖",
    "🦁", "🐯", "🐱", "🐶", "🐺", "🐻", "🐼", "🐨", "🐸", "🦊",
    "🦝", "🐷", "🐮", "🐽", "🐗", "🐴", "🦓", "🦄", "🐝", "🪲",
    "💫", "🦋", "🐌", "🐞", "🐜", "🕷", "🦂", "🐢", "🐍", "🦎",
    "🐙", "🦑", "🦀", "🕳", "🦐", "🦧", "🐘", "🦣", "🐇", "🐿"
];
let username = '';
let currentRoom = '';
let emojiUsername = '';

// Login Form Handler
loginForm.addEventListener('submit', function(e) {
    e.preventDefault();
    username = document.getElementById('username').value.trim();
    let roomId = document.getElementById('roomId').value.trim();

    if (!username) {
        alert('Please enter a username');
        return;
    }

    // Generate emoji username
    emojiUsername = EMOJIS[Math.floor(Math.random() * EMOJIS.length)] + ' ' + username;
    currentRoom = roomId || '456';

    // Join room
    socket.emit('join-room', {
        username,
        emojiUsername,
        room: currentRoom
    });
});

// Send Message Function
function sendMessage() {
    const message = messageInput.value.trim();
    if (message) {
        // Create message object
        const messageData = {
            room: currentRoom,
            username: username,
            emojiUsername: emojiUsername,
            message: message
        };

        // Emit message to server
        socket.emit('new-message', messageData);

        // Clear input
        messageInput.value = '';
    }
}

// Message Input Event Listeners
sendMessageBtn.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

// Socket Event Listeners
socket.on('join-success', (data) => {
    console.log('Successfully joined room');
    loginScreen.style.display = 'none';
    chatScreen.style.display = 'flex';
    welcomeMessage.textContent = `Hey! ${emojiUsername}`;

    addMessage({
        type: 'system',
        text: 'Welcome to the chat!'
    });
});

socket.on('user-joined', (data) => {
    console.log('User joined:', data);
    addMessage({
        type: 'system',
        text: `${data.emojiUsername} has joined the chat`
    });
});

// Socket Event Listener for receiving messages
socket.on('receive-message', (data) => {
    console.log('Message received:', data); // Debug log
    
    const messageElement = document.createElement('div');
    messageElement.className = `message ${data.username === username ? 'sent' : 'received'}`;
    messageElement.style.backgroundColor = getColorForUser(data.username);
    messageElement.textContent = `${data.emojiUsername}: ${data.message}`;
    messagesDiv.appendChild(messageElement);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;

    // Play sound for received messages
    if (data.username !== username) {
        messageSound.play().catch(err => console.log('Sound play error:', err));
    }
});

socket.on('user-left', (data) => {
    console.log('User left:', data);
    addMessage({
        type: 'system',
        text: `${data.emojiUsername} has left the chat`
    });
});

// Helper function to add messages to chat
function addMessage(messageData) {
    const messageElement = document.createElement('div');
    
    if (messageData.type === 'system') {
        messageElement.className = 'message system';
        messageElement.textContent = messageData.text;
    } else {
        messageElement.className = `message ${messageData.isSent ? 'sent' : 'received'}`;
        messageElement.style.backgroundColor = getColorForUser(messageData.sender);
        messageElement.textContent = `${messageData.sender}: ${messageData.text}`;
    }

    messagesDiv.appendChild(messageElement);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

function getColorForUser(username) {
    const colors = ['#DCF8C6', '#E9967A', '#FFD700', '#98FB98', '#DDA0DD'];
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
        hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
}