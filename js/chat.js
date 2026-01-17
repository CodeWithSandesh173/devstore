// Enhanced Chat functionality with Firebase
let currentChatId = null;
let chatUpdateInterval = null;

// Toggle chat window
function toggleChat() {
    const chatWindow = document.getElementById('chatWindow');
    if (chatWindow) {
        chatWindow.classList.toggle('active');
        if (chatWindow.classList.contains('active')) {
            if (!currentChatId) {
                initializeChat();
            }
            loadChatMessages();
            // Start real-time updates
            startChatUpdates();
        } else {
            // Stop real-time updates when chat is closed
            stopChatUpdates();
        }
    }
}

// Initialize chat for current user
function initializeChat() {
    onAuthStateChanged(user => {
        if (user) {
            currentChatId = user.uid;
            // Create or update chat metadata
            database.ref(`chats/${currentChatId}/metadata`).update({
                userId: user.uid,
                userEmail: user.email,
                lastActive: new Date().toISOString()
            });
        } else {
            // For guests, create anonymous chat ID
            currentChatId = localStorage.getItem('guestChatId');
            if (!currentChatId) {
                currentChatId = 'guest_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                localStorage.setItem('guestChatId', currentChatId);
            }
            database.ref(`chats/${currentChatId}/metadata`).update({
                userId: currentChatId,
                userEmail: 'Guest User',
                lastActive: new Date().toISOString()
            });
        }
    });
}

// Load chat messages
function loadChatMessages() {
    if (!currentChatId) {
        initializeChat();
        setTimeout(loadChatMessages, 500);
        return;
    }

    const chatRef = database.ref(`chats/${currentChatId}/messages`);
    const messagesContainer = document.getElementById('chatMessages');

    if (!messagesContainer) return;

    // Listen for new messages in real-time
    chatRef.on('value', snapshot => {
        messagesContainer.innerHTML = '';

        if (!snapshot.exists()) {
            messagesContainer.innerHTML = '<p class="text-muted" style="text-align: center; padding: 1rem;">Start a conversation...</p>';
            return;
        }

        snapshot.forEach(child => {
            const message = child.val();
            displayMessage(message);
        });

        // Scroll to bottom
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    });
}

// Display message in chat
function displayMessage(message) {
    const messagesContainer = document.getElementById('chatMessages');
    if (!messagesContainer) return;

    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${message.sender}`;

    const time = new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    messageDiv.innerHTML = `
        <div>${message.text}</div>
        <div style="font-size: 0.75rem; opacity: 0.7; margin-top: 0.25rem;">${time}</div>
    `;
    messagesContainer.appendChild(messageDiv);

    // Notify if message is from SUPPORT
    if (message.sender === 'support') {
        showUserNotification(message.text);
    }
}

// Send message
function sendMessage() {
    const input = document.getElementById('chatInput');
    if (!input) return;

    const messageText = input.value.trim();
    if (!messageText) return;

    if (!currentChatId) {
        alert('Chat not initialized. Please refresh and try again.');
        return;
    }

    const message = {
        text: messageText,
        sender: 'user',
        timestamp: new Date().toISOString(),
        read: false
    };

    // Save to Firebase
    database.ref(`chats/${currentChatId}/messages`).push(message)
        .then(() => {
            // Update chat metadata
            database.ref(`chats/${currentChatId}/metadata`).update({
                lastMessage: messageText,
                lastMessageTime: message.timestamp,
                unreadCount: firebase.database.ServerValue.increment(1),
                lastActive: new Date().toISOString()
            });

            input.value = '';
        })
        .catch(error => {
            console.error('Error sending message:', error);
            alert('Failed to send message. Please try again.');
        });
}

// Start real-time chat updates
function startChatUpdates() {
    if (chatUpdateInterval) return;

    chatUpdateInterval = setInterval(() => {
        if (currentChatId) {
            database.ref(`chats/${currentChatId}/metadata/lastActive`).set(new Date().toISOString());
        }
    }, 30000); // Update every 30 seconds
}

// Stop real-time chat updates
function stopChatUpdates() {
    if (chatUpdateInterval) {
        clearInterval(chatUpdateInterval);
        chatUpdateInterval = null;
    }
}

// Allow enter key to send message
document.addEventListener('DOMContentLoaded', () => {
    const chatInput = document.getElementById('chatInput');
    if (chatInput) {
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
    }

    // Initialize chat when page loads
    setTimeout(initializeChat, 1000);
    setTimeout(initChatNotifications, 2000); // Ask/setup notify after a bit
});

// Clean up on page unload
window.addEventListener('beforeunload', () => {
    stopChatUpdates();
    if (currentChatId) {
        database.ref(`chats/${currentChatId}/metadata/lastActive`).set(new Date().toISOString());
    }
});

// ===== USER NOTIFICATIONS =====
function initChatNotifications() {
    // Add bell icon to header if needed
    const header = document.querySelector('.chat-header');
    if (header) {
        // Create toggle button if not exists
        if (!document.getElementById('chatNotifyBtn')) {
            const btn = document.createElement('span');
            btn.id = 'chatNotifyBtn';
            btn.style.cursor = 'pointer';
            btn.style.float = 'right';
            btn.title = "Enable Notifications";
            btn.innerHTML = '🔔';
            btn.onclick = (e) => {
                e.stopPropagation();
                requestChatPermission();
            };
            header.appendChild(btn);

            // Check current state
            if (Notification.permission === 'granted') {
                btn.innerHTML = '✅';
                btn.title = "Notifications Active";
            }
        }
    }
}

function requestChatPermission() {
    Notification.requestPermission().then(permission => {
        const btn = document.getElementById('chatNotifyBtn');
        if (permission === "granted") {
            if (btn) {
                btn.innerHTML = '✅';
                btn.title = "Notifications Active";
            }
            // Logic handled in displayMessage
        } else {
            if (btn) {
                btn.innerHTML = '❌';
                btn.title = "Notifications Denied";
            }
        }
    });
}

function showUserNotification(text) {
    if (document.hidden && Notification.permission === "granted") {
        const n = new Notification("Dev Store Support", {
            body: text,
            icon: 'images/icon.png'
        });
        n.onclick = () => {
            window.focus();
            const chatWindow = document.getElementById('chatWindow');
            if (chatWindow && !chatWindow.classList.contains('active')) {
                toggleChat();
            }
        };
    }
}
