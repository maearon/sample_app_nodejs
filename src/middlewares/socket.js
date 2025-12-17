/* eslint-disable no-console */
import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';

export const socketAuthMiddleware = async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error('Unauthorized - Token không tồn tại'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded) {
      return next(new Error('Unauthorized - Token không hợp lệ hoặc đã hết hạn'));
    }

    const user = await User.findById(decoded.userId).select('-hashedPassword');

    if (!user) {
      return next(new Error('User không tồn tại'));
    }

    // eslint-disable-next-line no-param-reassign
    socket.user = user;

    next();
  } catch (error) {
    console.error('Lỗi khi verify JWT trong socketMiddleware', error);
    next(new Error('Unauthorized'));
  }
};
