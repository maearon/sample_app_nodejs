import mongoose from 'mongoose';
import { Server } from 'socket.io';
import app from './app.js';
import config from './config/config.js';
import logger from './config/logger.js';
import { initializeSocket } from './socket.js';

let server;
mongoose.connect(config.mongoose.url, config.mongoose.options).then(() => {
  logger.info('Connected to MongoDB');
  server = app.listen(config.port, () => {
    logger.info(`Listening to port ${config.port}`);
    logger.info(`Server + Socket.IO running on port ${config.port}`);
    // CORS configuration
    const corsOptions = {
      origin: process.env.CORS_ORIGIN
        ? process.env.CORS_ORIGIN.split(',')
        : [
            'http://localhost:5001',
            'http://localhost:5005',
            'https://maearon-todo-x.vercel.app',
            'https://moji-phi.vercel.app',
          ],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'x-requested-with'],
    };
    // Socket.IO setup
    const io = new Server(server, {
      cors: corsOptions,
      transports: ['websocket', 'polling'],
    });
    // Initialize socket handlers
    initializeSocket(io);
  });
});

const exitHandler = () => {
  if (server) {
    server.close(() => {
      logger.info('Server closed');
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
};

const unexpectedErrorHandler = (error) => {
  logger.error(error);
  exitHandler();
};

process.on('uncaughtException', unexpectedErrorHandler);
process.on('unhandledRejection', unexpectedErrorHandler);

process.on('SIGTERM', () => {
  logger.info('SIGTERM received');
  if (server) {
    server.close();
  }
});
