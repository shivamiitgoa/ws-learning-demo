# ws-learning-demo

A minimal real-time chat room built to learn **WebSockets** — no frameworks, just the raw `ws` protocol.

## What this teaches you

| Concept | Where to look |
|---|---|
| Upgrading HTTP → WebSocket | `server.js` — `WebSocketServer({ server })` |
| Handling connections | `wss.on('connection', ws => …)` |
| Sending & receiving messages | `ws.send()` / `ws.on('message', …)` |
| Broadcasting to all clients | `broadcast()` helper function |
| Detecting disconnection | `ws.on('close', …)` |
| Reconnecting on the client | `ws.onclose` → `setTimeout(connect, 3000)` |
| Raw frames in the browser | Expand "Raw WS frames" in the sidebar |

## Run locally

```bash
npm install
npm start
# open http://localhost:8080 in two browser tabs and chat
```

Use `npm run dev` for auto-restart on file changes (Node 18+).

## Project structure

```
├── server.js        # Node.js HTTP + WebSocket server (no frameworks)
├── public/
│   └── index.html   # Single-file frontend (vanilla JS)
├── package.json
├── Dockerfile       # For Cloud Run deployment
└── README.md
```

## Key WebSocket events (server-side)

```
wss.on('connection', ws)   → new client connected
ws.on('message', data)     → client sent a frame
ws.on('close', ...)        → client disconnected
ws.on('error', ...)        → something went wrong
ws.send(data)              → push a frame to this client
```

## Key WebSocket events (client-side / browser)

```
ws.onopen      → connection established
ws.onmessage   → server pushed a frame
ws.onclose     → connection dropped
ws.onerror     → network error
ws.send(data)  → send a frame to the server
```

## Message protocol

All messages are JSON. Types:

| type | direction | meaning |
|---|---|---|
| `welcome` | server → client | sent once on connect, carries your id/name/color |
| `chat` | both | a chat message |
| `system` | server → all | join/leave/rename announcements |
| `user_list` | server → all | updated list of online users |
| `ping` / `pong` | client → server / server → client | heartbeat |

## Rename yourself

In the chat input, type:
```
/name YourNewName
```

## Cleanup

When you're done learning, delete the GCP project:
```bash
gcloud projects delete ws-learning-demo
```
This stops all billing for the deployment immediately.
