/* eslint-disable no-param-reassign */
/* eslint-disable security-node/detect-crlf */
/* eslint-disable no-console */
// socket.js — FULL FILE, converted from TypeScript → ESModule JavaScript
// Replaced Prisma + Drizzle with Mongoose Models
// Maintained all comments, structure, naming, event logic

import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';

// 👉 Mongoose models
import User from './models/user.model.js';
import Message from './models/message.model.js';
import Room from './models/conversation.model.js';

// export const getGravatarUrl = (email, size = 50) => {
//   const hash = md5(email.trim().toLowerCase());
//   return `https://secure.gravatar.com/avatar/${hash}?s=${size}`;
// };

// Enum replacement (JS)
const MessageType = {
  TEXT: 'TEXT',
  IMAGE: 'IMAGE',
  FILE: 'FILE',
};

// Main function
export function initializeSocket(io) {
  // Middleware: JWT auth
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.query.token || socket.handshake.headers.authorization?.replace('Bearer ', '');

      if (!token) return next(new Error('Authentication token required'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      if (!decoded?.sub) return next(new Error('Invalid token payload'));

      const user = await User.findById(decoded.sub).lean();

      if (!user) return next(new Error('User not found from token sub'));

      // Attach auth info to socket.data to avoid assigning to the function parameter directly
      // socket.data = socket.data || {};
      socket.data.userId = user._id.toString();
      socket.data.userEmail = user.email;

      console.log(`✅ User authenticated: ${user.email} (${user._id})`);
      return next();
    } catch (error) {
      console.error('❌ Socket authentication failed:', error);
      return next(new Error('Invalid authentication token'));
    }
  });
  io.on('connection', (socket) => {
    console.log(`🔌 User connected: ${socket.data?.userEmail} (${socket.id})`);

    // JOIN ROOM
    socket.on('join_room', async ({ roomId }) => {
      try {
        let room = await Room.findById(roomId);

        if (!room) {
          room = await Room.create({
            _id: roomId,
            name: roomId,
            type: 'public',
          });
        }

        socket.join(roomId);

        // Load last 50 messages
        // const messages = await Message.find({ room_id: roomId }).sort({ created_at: -1 }).limit(50).lean();

        // Map messages with user info
        // const enrichedMessages = await Promise.all(
        //   messages.map(async (msg) => {
        //     const user = await User.findById(msg.user_id).lean();

        //     return {
        //       ...msg,
        //       users: user
        //         ? {
        //             id: user._id,
        //             email: user.email,
        //             name: user.name,
        //             // avatar: getGravatarUrl(user.email ?? 'default@example.com'),
        //           }
        //         : null,
        //     };
        //   }),
        // );
        const enrichedMessages = await Message.find({ room_id: roomId })
          .populate('user_id', 'name email')
          .sort({ created_at: -1 })
          .limit(50)
          .lean();

        socket.emit('message_history', {
          roomId,
          messages: enrichedMessages.reverse(),
        });

        socket.to(roomId).emit('user_joined', {
          userId: socket.data.userId,
          userEmail: socket.data.userEmail,
          roomId,
        });

        console.log(`👥 User ${socket.data?.userEmail} joined room ${roomId}`);
      } catch (error) {
        console.error('❌ Error joining room:', error);
        return socket.emit('error', { message: 'Failed to join room' });
      }
    });
    socket.on('message', async ({ roomId, content, isAi, type = 'text' }) => {
      try {
        if (!content?.trim()) {
          return socket.emit('error', { message: 'Message content is required' });
        }

        const messageType = type.toUpperCase() || 'TEXT';

        const message = await Message.create({
          _id: randomUUID(),
          content: content.trim(),
          type: MessageType[messageType],
          room_id: roomId,
          user_id: socket.data.userId,
          is_ai: !!isAi,
        });

        await Room.findByIdAndUpdate(roomId, {
          last_message: content.trim(),
          last_message_at: new Date(),
        });

        const userInfo = await User.findById(socket.data.userId).lean();

        io.to(roomId).emit('new_message', {
          id: message._id,
          content: message.content,
          type: message.type,
          roomId: message.room_id,
          users: {
            id: userInfo._id,
            name: userInfo.name,
            email: userInfo.email,
            // avatar: getGravatarUrl(userInfo.email),
          },
          createdAt: message.createdAt,
          is_ai: message.is_ai,
          isBot: message.is_ai, // backward compatibility
        });

        console.log(`💬 Message in ${roomId} by ${socket.data?.userEmail}`);
      } catch (error) {
        console.error('❌ Error sending message:', error);
        return socket.emit('error', { message: 'Failed to send message' });
      }
    });

    socket.on('typing', ({ roomId, isTyping }) => {
      socket.to(roomId).emit('user_typing', {
        userId: socket.data.userId,
        userEmail: socket.data.userEmail,
        isTyping,
      });
    });

    socket.on('leave_room', ({ roomId }) => {
      socket.leave(roomId);

      socket.to(roomId).emit('user_left', {
        userId: socket.data.userId,
        userEmail: socket.data.userEmail,
        roomId,
      });

      console.log(`👋 User ${socket.data?.userEmail} left room ${roomId}`);
    });

    socket.on('disconnect', () => {
      console.log(`🔌 User disconnected: ${socket.data?.userEmail} (${socket.id})`);
    });
  });
}
