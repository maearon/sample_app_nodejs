import httpStatus from 'http-status';
import ApiError from '../../utils/ApiError.js';
import catchAsync from '../../utils/catchAsync.js';
import { authService, userService, tokenService, emailService } from '../../services/index.js';

const REFRESH_TOKEN_TTL = 14 * 24 * 60 * 60 * 1000; // 14 ngày

const register = catchAsync(async (req, res) => {
  const { username, password, email, firstName, lastName } = req.body;
  if (!username || !password || !email || !firstName || !lastName) {
    return res.status(400).json({
      message: 'Không thể thiếu username, password, email, firstName, và lastName',
    });
  }
  const user = await userService.createUser(req.body);
  const ipAddress = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress;
  const userAgent = req.headers['user-agent'];
  const tokens = await tokenService.generateAuthTokensVer2(user, {
    ipAddress,
    userAgent,
  });
  res.status(httpStatus.CREATED).send({ user, tokens });
});

const login = catchAsync(async (req, res) => {
  // lấy inputs
  const { identifier, password } = req.body;
  // const { email, password } = req.body;
  if (!identifier || !password) {
    return res.status(400).json({ message: 'Thiếu username/email/phone/ID hoặc password.' });
  }
  const user = await authService.loginWithIdentifier(identifier, password);
  const ipAddress = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress;
  const userAgent = req.headers['user-agent'];
  const { accessToken, refreshToken } = await tokenService.generateAuthTokensVer2(user, {
    ipAddress,
    userAgent,
  });
  // trả refresh token về trong cookie
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'none', // backend, frontend deploy riêng
    maxAge: REFRESH_TOKEN_TTL,
  });
  // res.send({ user, tokens });
  // trả access token về trong res
  return res.status(200).json({ message: `User ${user.displayName} đã logged in!`, accessToken });
});

const me = catchAsync(async (req, res) => {
  if (!req.user) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate 2');
  }
  res.send(req.user);
});

const logout = catchAsync(async (req, res) => {
  // lấy refresh token từ cookie
  const token = req.cookies?.refreshToken;
  if (token) {
    // xoá refresh token trong Session
    // await Session.deleteOne({ refreshToken: token });
    await authService.logoutVer2(token);

    // xoá cookie
    res.clearCookie('refreshToken');
  }
  // await authService.logout(req.body.refreshToken);
  res.status(httpStatus.NO_CONTENT).send();
});

const refreshTokens = catchAsync(async (req, res) => {
  // lấy refresh token từ cookie
  const token = req.cookies?.refreshToken;
  if (!token) {
    return res.status(httpStatus.UNAUTHORIZED).json({ message: 'Token không tồn tại.' });
  }
  // const tokens = await authService.refreshAuth(req.body.refreshToken);
  const accessToken = await authService.refreshAuthVer2(token);
  // res.send({ ...tokens });
  // return
  return res.status(200).json({ accessToken });
});

const forgotPassword = catchAsync(async (req, res) => {
  const resetPasswordToken = await tokenService.generateResetPasswordToken(req.body.email);
  await emailService.sendResetPasswordEmail(req.body.email, resetPasswordToken);
  res.status(httpStatus.NO_CONTENT).send();
});

const resetPassword = catchAsync(async (req, res) => {
  await authService.resetPassword(req.query.token, req.body.password);
  res.status(httpStatus.NO_CONTENT).send();
});

const sendVerificationEmail = catchAsync(async (req, res) => {
  const verifyEmailToken = await tokenService.generateVerifyEmailToken(req.user);
  await emailService.sendVerificationEmail(req.user.email, verifyEmailToken);
  res.status(httpStatus.NO_CONTENT).send();
});

const verifyEmail = catchAsync(async (req, res) => {
  await authService.verifyEmail(req.query.token);
  res.status(httpStatus.NO_CONTENT).send();
});

export default {
  register,
  login,
  me,
  logout,
  refreshTokens,
  forgotPassword,
  resetPassword,
  sendVerificationEmail,
  verifyEmail,
};
