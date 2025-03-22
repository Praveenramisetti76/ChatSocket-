const socket = new WebSocket('ws://localhost:3000');

let username = '';

document.addEventListener('DOMContentLoaded', () => {
    username = prompt('Enter your username:') || "Guest_" + Math.floor(Math.random() * 1000);

    socket.addEventListener('open', () => {
        socket.send(JSON.stringify({ type: 'join', username }));
    });

    socket.addEventListener('message', (event) => {
        const data = JSON.parse(event.data);

        if (data.type === 'chat') {
            appendMessage(data.username, data.message, data.time);
        }

        if (data.type === 'userlist') {
            updateUserList(data.users);
        }

        if (data.type === 'history') {
            data.history.forEach(item => {
                appendMessage(item.username, item.message, item.time);
            });
        }
    });

    const input = document.getElementById('message');
    const sendBtn = document.getElementById('send');

    sendBtn.addEventListener('click', () => {
        sendMsg();
    });

    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMsg();
    });

    function sendMsg() {
        const message = input.value.trim();
        if (message !== '') {
            socket.send(JSON.stringify({ type: 'chat', username, message }));
            input.value = '';
        }
    }
});

function appendMessage(user, message, time) {
    const messages = document.getElementById('messages');
    const div = document.createElement('div');
    div.innerHTML = `<strong>${user}:</strong> ${message} <span class="time">${new Date(time).toLocaleTimeString()}</span>`;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
}

function updateUserList(users) {
    const sidebar = document.getElementById('users');
    sidebar.innerHTML = `<h3>Users Online</h3>`;
    const ul = document.createElement('ul');
    users.forEach(user => {
        const li = document.createElement('li');
        li.textContent = user;
        ul.appendChild(li);
    });
    sidebar.appendChild(ul);
}