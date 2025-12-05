import mongoose from 'mongoose';
import app from './app.js';
import config from './config/config.js';
import logger from './config/logger.js';
import { initSocket } from './socket/index.js';

let server;

mongoose
  .connect(config.mongoose.url, config.mongoose.options)
  .then(() => {
    logger.info('Connected to MongoDB');

    server = app.listen(config.port, () => {
      logger.info(`Listening to port ${config.port}`);

      // GẮN SOCKET IO VÀO SERVER CHÍNH
      initSocket(server);
      logger.info('Socket.IO initialized');
    });
  })
  .catch((err) => {
    logger.error('MongoDB connection error:', err);
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
