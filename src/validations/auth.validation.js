import Joi from 'joi';
import { password } from './custom.validation.js';

const register = {
  body: Joi.object().keys({
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    username: Joi.string().required(),
    email: Joi.string().required().email(),
    password: Joi.string().required().custom(password),
  }),
};

const login = {
  body: Joi.object().keys({
    username: Joi.string().required(),
    password: Joi.string().required(),
  }),
};

const logout = {
  // body: Joi.object().keys({
  //   refreshToken: Joi.string().required(),
  // }),
  body: Joi.object().optional().unknown(true),
};

const refreshTokens = {
  // body: Joi.object().keys({
  //   refreshToken: Joi.string().required(),
  // }),
  body: Joi.object().optional().unknown(true),
};

const forgotPassword = {
  body: Joi.object().keys({
    email: Joi.string().email().required(),
  }),
};

const resetPassword = {
  query: Joi.object().keys({
    token: Joi.string().required(),
  }),
  body: Joi.object().keys({
    password: Joi.string().required().custom(password),
  }),
};

const verifyEmail = {
  query: Joi.object().keys({
    token: Joi.string().required(),
  }),
};

export default { register, login, logout, refreshTokens, forgotPassword, resetPassword, verifyEmail };
