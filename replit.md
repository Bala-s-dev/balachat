# SecureChat

A real-time messaging platform with end-to-end encryption (AES-256). Messages are encrypted on the client side before being sent, so the server only ever handles encrypted payloads.

## Architecture

- **Frontend**: React 18 + Vite, runs on port 5000 (0.0.0.0)
- **Backend**: Node.js + Express 5 + Socket.io, runs on port 3000 (localhost)
- **Database**: MongoDB (via Mongoose)
- **Auth**: JWT tokens + bcrypt password hashing
- **Encryption**: AES-256 via crypto-js (client-side)
- **State**: Zustand

## Project Structure

```
client/          React frontend (Vite)
  src/
    components/  UI components (chat, detail, list, login, notification)
    lib/         api.js, userStore.js, chatStore.js, crypto.js
  vite.config.js Vite config (port 5000, proxy to backend at 3000)

server/          Node.js backend
  controllers/   auth, chats, messages, users, upload
  models/        Mongoose schemas
  routes/        Express API routes
  middleware/     JWT auth middleware
  server.js      Main entry point
  socket.js      Socket.io event handlers

start.sh         Starts both frontend and backend concurrently
```

## Environment Secrets Required

- `MONGO_URI` - MongoDB connection string
- `JWT_SECRET` - Secret for signing JWT tokens

## Running Locally

```bash
bash start.sh
```

This starts:
1. Backend (nodemon) on port 3000
2. Frontend (Vite) on port 5000

The frontend proxies `/api`, `/socket.io`, and `/uploads` requests to the backend at localhost:3000.

## Deployment

Configured as a VM deployment (always-on) using `bash start.sh`. Uses VM target because of persistent WebSocket connections via Socket.io.
