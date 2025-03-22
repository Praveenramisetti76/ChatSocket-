const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');
const http = require('http');

const server = http.createServer((req, res) => {
    let filePath = '.' + req.url;
    if (filePath === './') filePath = './index.html';

    const extname = String(path.extname(filePath)).toLowerCase();
    const mimeTypes = {
        '.html': 'text/html',
        '.js': 'application/javascript',
        '.css': 'text/css'
    };

    const contentType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(filePath, (err, content) => {
        if (err) {
            res.writeHead(500);
            res.end('Server Error');
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

const wss = new WebSocket.Server({ server });

let clients = [];
let users = loadJSON('users.json') || [];
let chatHistory = loadJSON('chatlog.json') || [];

function saveJSON(filename, data) {
    fs.writeFileSync(path.join(__dirname, filename), JSON.stringify(data, null, 2));
}

function loadJSON(filename) {
    if (fs.existsSync(path.join(__dirname, filename))) {
        return JSON.parse(fs.readFileSync(path.join(__dirname, filename)));
    }
    return null;
}

wss.on('connection', (ws) => {
    ws.on('message', (data) => {
        const msg = JSON.parse(data);

        if (msg.type === 'join') {
            ws.username = msg.username;
            ws.id = Date.now() + Math.random();
            clients.push(ws);

            if (!users.find(u => u.username === msg.username)) {
                users.push({ username: msg.username, joined: new Date().toISOString() });
                saveJSON('users.json', users);
            }

            ws.send(JSON.stringify({ type: 'history', history: chatHistory }));

            broadcast({
                type: 'userlist',
                users: clients.map(c => c.username)
            });
        }

        if (msg.type === 'chat') {
            const chatEntry = { username: msg.username, message: msg.message, time: new Date() };
            chatHistory.push(chatEntry);
            saveJSON('chatlog.json', chatHistory);
            broadcast({ type: 'chat', ...chatEntry });
        }
    });

    ws.on('close', () => {
        clients = clients.filter(c => c !== ws);
        broadcast({
            type: 'userlist',
            users: clients.map(c => c.username)
        });
    });
});

function broadcast(data) {
    clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
}

server.listen(3000, () => console.log("✅ Server running at http://localhost:3000"));
