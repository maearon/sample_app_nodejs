import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';

export const socketAuthMiddleware = async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error('Unauthorized - Token does not exist'));
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded) {
      return next(new Error('Unauthorized - Token is invalid or expired'));
    }
    // eslint-disable-next-line no-console, security-node/detect-crlf
    // console.log('decoded.userId', decoded);
    const user = await User.findById(decoded.sub).select('-hashedPassword');
    if (!user) {
      return next(new Error('User does not exist'));
    }
    // eslint-disable-next-line no-param-reassign
    socket.user = user;
    next();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error verifying JWT in socketAuthMiddleware', error);
    next(new Error('Unauthorized'));
  }
};
