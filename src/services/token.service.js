import jwt from 'jsonwebtoken';
import moment from 'moment';
import httpStatus from 'http-status';
import config from '../config/config.js';
import userService from './user.service.js';
import { Session, Token } from '../models/index.js';
import ApiError from '../utils/ApiError.js';
import { tokenTypes } from '../config/tokens.js';

const ACCESS_TOKEN_TTL = '30m'; // thuờng là dưới 15m
const REFRESH_TOKEN_TTL = 14 * 24 * 60 * 60 * 1000; // 14 ngày

/**
 * Generate token
 * @param {ObjectId} userId
 * @param {string} [secret]
 * @returns {string}
 */
const generateTokenVer2 = (userId) => {
  // tạo access token mới
  const accessToken = jwt.sign(
    {
      userId,
    },
    process.env.JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_TTL },
  );
  return accessToken;
};

/**
 * Generate token
 * @param {ObjectId} userId
 * @param {Moment} expires
 * @param {string} type
 * @param {string} [secret]
 * @returns {string}
 */
const generateToken = (userId, expires, type, secret = config.jwt.secret) => {
  const payload = {
    sub: userId,
    iat: moment().unix(),
    exp: expires.unix(),
    type,
  };
  return jwt.sign(payload, secret);
};

/**
 * Save a token
 * @param {string} token
 * @param {ObjectId} userId
 * @param {Moment} expires
 * @param {string} type
 * @param {boolean} [blacklisted]
 * @returns {Promise<Token>}
 */
const saveToken = async (token, userId, expires, type, blacklisted = false) => {
  const tokenDoc = await Token.create({
    token,
    user: userId,
    expires: expires.toDate(),
    type,
    blacklisted,
  });
  return tokenDoc;
};

/**
 * Verify token and return token doc (or throw an error if it is not valid)
 * @param {string} token
 * @returns {Promise<Token>}
 */
const verifyTokenVer2 = async (token) => {
  // so với refresh token trong db
  const tokenDoc = await Session.findOne({ refreshToken: token });
  if (!tokenDoc) {
    throw new Error('Token not found');
  }
  // kiểm tra hết hạn chưa
  if (tokenDoc.expiresAt < new Date()) {
    await tokenDoc.deleteOne(); // xoá token hết hạn khỏi db nếu có thể để tránh đầy db
    throw new Error('Token đã hết hạn.');
  }
  return tokenDoc;
};

/**
 * Verify token and return token doc (or throw an error if it is not valid)
 * @param {string} token
 * @param {string} type
 * @returns {Promise<Token>}
 */
const verifyToken = async (token, type) => {
  const payload = jwt.verify(token, config.jwt.secret);
  const tokenDoc = await Token.findOne({ token, type, user: payload.sub, blacklisted: false });
  if (!tokenDoc) {
    throw new Error('Token not found');
  }
  return tokenDoc;
};

/**
 * Generate auth tokens
 * @param {User} user
 * @returns {Promise<Object>}
 */
const generateAuthTokensVer2 = async (user) => {
  // const accessTokenExpires = moment().add(config.jwt.accessExpirationMinutes, 'minutes');
  // const accessToken = generateToken(user.id, accessTokenExpires, tokenTypes.ACCESS);

  // const refreshTokenExpires = moment().add(config.jwt.refreshExpirationDays, 'days');
  // const refreshToken = generateToken(user.id, refreshTokenExpires, tokenTypes.REFRESH);
  // await saveToken(refreshToken, user.id, refreshTokenExpires, tokenTypes.REFRESH);

  // return {
  //   access: {
  //     token: accessToken,
  //     expires: accessTokenExpires.toDate(),
  //   },
  //   refresh: {
  //     token: refreshToken,
  //     expires: refreshTokenExpires.toDate(),
  //   },
  // };
  // nếu khớp, tạo accessToken với JWT
  const accessToken = jwt.sign(
    { userId: user._id },
    // @ts-ignore
    process.env.JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_TTL },
  );
  // tạo refresh token
  const refreshToken = crypto.randomBytes(64).toString('hex');
  // tạo session mới để lưu refresh token
  await Session.create({
    userId: user._id,
    refreshToken,
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL),
  });
  return { accessToken, refreshToken };
};

/**
 * Generate auth tokens
 * @param {User} user
 * @returns {Promise<Object>}
 */
const generateAuthTokens = async (user) => {
  const accessTokenExpires = moment().add(config.jwt.accessExpirationMinutes, 'minutes');
  const accessToken = generateToken(user.id, accessTokenExpires, tokenTypes.ACCESS);

  const refreshTokenExpires = moment().add(config.jwt.refreshExpirationDays, 'days');
  const refreshToken = generateToken(user.id, refreshTokenExpires, tokenTypes.REFRESH);
  await saveToken(refreshToken, user.id, refreshTokenExpires, tokenTypes.REFRESH);

  return {
    access: {
      token: accessToken,
      expires: accessTokenExpires.toDate(),
    },
    refresh: {
      token: refreshToken,
      expires: refreshTokenExpires.toDate(),
    },
  };
};

/**
 * Generate reset password token
 * @param {string} email
 * @returns {Promise<string>}
 */
const generateResetPasswordToken = async (email) => {
  const user = await userService.getUserByEmail(email);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'No users found with this email');
  }
  const expires = moment().add(config.jwt.resetPasswordExpirationMinutes, 'minutes');
  const resetPasswordToken = generateToken(user.id, expires, tokenTypes.RESET_PASSWORD);
  await saveToken(resetPasswordToken, user.id, expires, tokenTypes.RESET_PASSWORD);
  return resetPasswordToken;
};

/**
 * Generate verify email token
 * @param {User} user
 * @returns {Promise<string>}
 */
const generateVerifyEmailToken = async (user) => {
  const expires = moment().add(config.jwt.verifyEmailExpirationMinutes, 'minutes');
  const verifyEmailToken = generateToken(user.id, expires, tokenTypes.VERIFY_EMAIL);
  await saveToken(verifyEmailToken, user.id, expires, tokenTypes.VERIFY_EMAIL);
  return verifyEmailToken;
};

export default {
  generateTokenVer2,
  generateToken,
  saveToken,
  verifyTokenVer2,
  verifyToken,
  generateAuthTokensVer2,
  generateAuthTokens,
  generateResetPasswordToken,
  generateVerifyEmailToken,
};
