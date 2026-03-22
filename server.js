const http = require('http');
const fs = require('fs');
const path = require('path');
const { WebSocketServer } = require('ws');

const PORT = process.env.PORT || 8080;

// --- HTTP server: serves the frontend ---
const httpServer = http.createServer((req, res) => {
  if (req.url === '/' || req.url === '/index.html') {
    const filePath = path.join(__dirname, 'public', 'index.html');
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(500);
        res.end('Error loading page');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(data);
    });
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

// --- WebSocket server: attached to the same HTTP server ---
const wss = new WebSocketServer({ server: httpServer });

// Track connected clients: Map<ws, { id, name }>
const clients = new Map();
let nextId = 1;

const COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899',
];

function broadcast(message) {
  const data = JSON.stringify(message);
  for (const [client] of clients) {
    if (client.readyState === client.OPEN) {
      client.send(data);
    }
  }
}

function broadcastUserList() {
  const users = Array.from(clients.values()).map(u => ({ id: u.id, name: u.name, color: u.color }));
  broadcast({ type: 'user_list', users });
}

wss.on('connection', (ws) => {
  const id = nextId++;
  const name = `User ${id}`;
  const color = COLORS[(id - 1) % COLORS.length];
  clients.set(ws, { id, name, color });

  console.log(`[+] ${name} connected. Total: ${clients.size}`);

  // Send welcome message only to the new client
  ws.send(JSON.stringify({
    type: 'welcome',
    id,
    name,
    color,
    message: `Welcome, ${name}! There are ${clients.size} user(s) online.`,
  }));

  // Notify everyone else about the new user
  broadcast({ type: 'system', text: `${name} joined the room.` });

  // Send updated user list to all
  broadcastUserList();

  // Handle incoming messages from this client
  ws.on('message', (raw) => {
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return;
    }

    const user = clients.get(ws);
    if (!user) return;

    if (parsed.type === 'chat') {
      const text = String(parsed.text || '').trim().slice(0, 500);
      if (!text) return;

      // If user wants to rename: "/name NewName"
      if (text.startsWith('/name ')) {
        const newName = text.slice(6).trim().slice(0, 30);
        if (newName) {
          const oldName = user.name;
          user.name = newName;
          broadcast({ type: 'system', text: `${oldName} is now known as ${newName}.` });
          broadcastUserList();
        }
        return;
      }

      console.log(`[msg] ${user.name}: ${text}`);
      broadcast({
        type: 'chat',
        from: user.name,
        color: user.color,
        text,
        ts: new Date().toISOString(),
      });
    }

    if (parsed.type === 'ping') {
      ws.send(JSON.stringify({ type: 'pong' }));
    }
  });

  ws.on('close', () => {
    const user = clients.get(ws);
    if (user) {
      console.log(`[-] ${user.name} disconnected. Total: ${clients.size - 1}`);
      clients.delete(ws);
      broadcast({ type: 'system', text: `${user.name} left the room.` });
      broadcastUserList();
    }
  });

  ws.on('error', (err) => {
    console.error('WebSocket error:', err.message);
  });
});

httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`WebSocket endpoint: ws://localhost:${PORT}`);
});
