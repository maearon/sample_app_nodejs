import { Server } from 'socket.io';
// import http from 'http';
// import express from 'express';
import { socketAuthMiddleware } from '../middlewares/socket.js';
// eslint-disable-next-line import/no-cycle
import { getUserConversationsForSocketIO } from '../controllers/api/conversation.controller.js';

// const app = express();

// const server = http.createServer(app);
let io = null;
// const onlineUsers = new Map();

export function initSocket(server) {
  // const
  io = new Server(server, {
    cors: {
      // origin: process.env.CLIENT_URL,
      origin: [
        'https://moji-realtime-chat-app.vercel.app',
        'https://moji-phi.vercel.app',
        'https://bugbook-messenger.vercel.app',
        'http://localhost:5005',
        'http://localhost:5173',
      ],
      credentials: true,
    },
  });

  io.use(socketAuthMiddleware);

  const onlineUsers = new Map(); // {userId: socketId}

  io.on('connection', async (socket) => {
    const { user } = socket;

    // console.log(`🔌 User connected: user.displayName(${user.displayName}) online với socket ${socket.id}`);

    onlineUsers.set(user._id, socket.id);

    io.emit('online-users', Array.from(onlineUsers.keys()));

    const conversationIds = await getUserConversationsForSocketIO(user._id);
    conversationIds.forEach((id) => {
      socket.join(id);
    });

    socket.on('join-conversation', (conversationId) => {
      socket.join(conversationId);
    });

    socket.join(user._id.toString());

    socket.on('typing', ({ conversationId, isTyping }) => {
      socket.to(conversationId).emit('user-typing', {
        conversationId,
        userId: user._id,
        isTyping,
      });
    });

    socket.on('disconnect', () => {
      onlineUsers.delete(user._id);
      io.emit('online-users', Array.from(onlineUsers.keys()));
      /* console.log(`socket disconnected: ${socket.id}`); */
    });
  });
}

// export { io, app, server };
export function getIO() {
  if (!io) throw new Error('Socket.IO not initialized');
  return io;
}
