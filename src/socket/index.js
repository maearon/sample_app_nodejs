import { Server } from 'socket.io';
import { socketAuthMiddleware } from '../middlewares/socket.js';
import { getUserConversationForSocketIO } from '../controllers/api/conversation.controller.js';

let io = null;
const onlineUsers = new Map();

export function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: ['http://localhost:5005', 'https://moji-phi.vercel.app'],
      credentials: true,
    },
  });

  io.use(socketAuthMiddleware);

  io.on('connection', async (socket) => {
    const { user } = socket;
    // eslint-disable-next-line security-node/detect-crlf, no-console
    console.log(`🔌 User connected: ${user.email}`);

    onlineUsers.set(user._id.toString(), socket.id);

    io.emit('online-users', Array.from(onlineUsers.keys()));

    const conversationIds = await getUserConversationForSocketIO(user._id);

    conversationIds.forEach((id) => socket.join(id.toString()));

    socket.on('disconnect', () => {
      onlineUsers.delete(user._id.toString());
      io.emit('online-users', Array.from(onlineUsers.keys()));
      // eslint-disable-next-line no-console, security-node/detect-crlf
      console.log(`🔌 User disconnected: ${user.email}`);
    });
  });
}

export function getIO() {
  if (!io) throw new Error('Socket.IO not initialized');
  return io;
}
