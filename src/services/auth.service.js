import httpStatus from 'http-status';
import tokenService from './token.service.js';
import userService from './user.service.js';
import Token from '../models/token.model.js';
import Session from '../models/session.model.js';
import ApiError from '../utils/ApiError.js';
import { tokenTypes } from '../config/tokens.js';

/**
 * Login with username and password
 * @param {string} identifier
 * @param {string} password
 * @returns {Promise<User>}
 */
const loginWithIdentifier = async (identifier, password) => {
  let user;

  // 1️⃣ Email
  if (identifier.includes('@')) {
    user = await userService.getUserByEmail(identifier);
  }

  // 2️⃣ Phone (số)
  // else if (/^\+?\d{9,15}$/.test(identifier)) {
  //   user = await userService.getUserByUsernam(identifier);
  // }

  // 3️⃣ Username
  else {
    user = await userService.getUserByUsername(identifier);
  }

  // 4 ID
  // else {
  //   user = await userService.getUserById(identifier);
  // }

  if (!user || !(await user.isPasswordMatch(password))) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Incorrect identifier or password');
  }

  return user;
};

/**
 * Login with username and password
 * @param {string} username
 * @param {string} password
 * @returns {Promise<User>}
 */
const loginUserWithUsernameAndPassword = async (username, password) => {
  const user = await userService.getUserByUsername(username);
  if (!user || !(await user.isPasswordMatch(password))) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Incorrect username or password');
  }
  return user;
};

/**
 * Login with email and password
 * @param {string} email
 * @param {string} password
 * @returns {Promise<User>}
 */
const loginUserWithEmailAndPassword = async (email, password) => {
  const user = await userService.getUserByEmail(email);
  if (!user || !(await user.isPasswordMatch(password))) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Incorrect email or password');
  }
  return user;
};

/**
 * Logout
 * @param {string} refreshToken
 * @returns {Promise}
 */
const logoutVer2 = async (refreshToken) => {
  const refreshTokenDoc = await Session.findOne({ refreshToken });
  if (!refreshTokenDoc) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Not found');
  }
  await refreshTokenDoc.deleteOne();
};

/**
 * Logout
 * @param {string} refreshToken
 * @returns {Promise}
 */
const logout = async (refreshToken) => {
  const refreshTokenDoc = await Token.findOne({ token: refreshToken, type: tokenTypes.REFRESH, blacklisted: false });
  if (!refreshTokenDoc) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Not found');
  }
  await refreshTokenDoc.deleteOne();
};

/**
 * Refresh auth tokens
 * @param {string} refreshToken
 * @returns {Promise<Object>}
 */
const refreshAuthVer2 = async (refreshToken) => {
  try {
    const refreshTokenDoc = await tokenService.verifyTokenVer2(refreshToken);
    const user = await userService.getUserById(refreshTokenDoc.userId);
    if (!user) {
      throw new Error();
    }
    return tokenService.generateTokenVer2(user.id);
  } catch (error) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate 3');
  }
};

/**
 * Refresh auth tokens
 * @param {string} refreshToken
 * @returns {Promise<Object>}
 */
const refreshAuth = async (refreshToken) => {
  try {
    const refreshTokenDoc = await tokenService.verifyToken(refreshToken, tokenTypes.REFRESH);
    const user = await userService.getUserById(refreshTokenDoc.userId);
    if (!user) {
      throw new Error();
    }
    await refreshTokenDoc.deleteOne();
    return tokenService.generateAuthTokens(user);
  } catch (error) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate 3');
  }
};

/**
 * Reset password
 * @param {string} resetPasswordToken
 * @param {string} newPassword
 * @returns {Promise}
 */
const resetPassword = async (resetPasswordToken, newPassword) => {
  try {
    const resetPasswordTokenDoc = await tokenService.verifyToken(resetPasswordToken, tokenTypes.RESET_PASSWORD);
    const user = await userService.getUserById(resetPasswordTokenDoc.userId);
    if (!user) {
      throw new Error();
    }
    await userService.updateUserById(user.id, { password: newPassword });
    await Token.deleteMany({ user: user.id, type: tokenTypes.RESET_PASSWORD });
  } catch (error) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Password reset failed');
  }
};

/**
 * Verify email
 * @param {string} verifyEmailToken
 * @returns {Promise}
 */
const verifyEmail = async (verifyEmailToken) => {
  try {
    const verifyEmailTokenDoc = await tokenService.verifyToken(verifyEmailToken, tokenTypes.VERIFY_EMAIL);
    const user = await userService.getUserById(verifyEmailTokenDoc.user);
    if (!user) {
      throw new Error();
    }
    await Token.deleteMany({ user: user.id, type: tokenTypes.VERIFY_EMAIL });
    await userService.updateUserById(user.id, { isEmailVerified: true });
  } catch (error) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Email verification failed');
  }
};

export default {
  loginWithIdentifier,
  loginUserWithUsernameAndPassword,
  loginUserWithEmailAndPassword,
  logoutVer2,
  logout,
  refreshAuthVer2,
  refreshAuth,
  resetPassword,
  verifyEmail,
};
