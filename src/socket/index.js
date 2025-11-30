import { Server } from 'socket.io';
import { createServer } from 'http';
import express from 'express';
import { socketAuthMiddleware } from '../middlewares/socket.js';

const app = express();

const server = createServer(app);

const io = new Server(server, {
  cors: 'https://moji-phi.vercel.app',
  credentials: true,
  // transports: ['websocket', 'polling'],
});

io.use(socketAuthMiddleware);

const onlineUsers = new Map(); // {userId: socketId}

io.on('connection', async (socket) => {
  // eslint-disable-next-line prefer-destructuring
  const user = socket.user;
  // eslint-disable-next-line no-console, security-node/detect-crlf
  console.log(`🔌 User connected: ${user?.email} (${socket.id})`);

  onlineUsers.set(user._id, socket.id);

  io.emit('online-users', Array.from(onlineUsers.keys()));

  socket.on('disconnect', () => {
    onlineUsers.delete(user._id);
    io.emit('online-users', Array.from(onlineUsers.keys()));
    // eslint-disable-next-line no-console, security-node/detect-crlf
    console.log(`🔌 User disconnected: ${user?.email} (${socket.id})`);
  });
});

export { io, app, server };
