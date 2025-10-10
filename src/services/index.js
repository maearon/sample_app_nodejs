// module.exports.authService = require('./auth.service');
// module.exports.emailService = require('./email.service');
// module.exports.tokenService = require('./token.service');
// module.exports.userService = require('./user.service');

import authService from './auth.service.js';
import emailService from './email.service.js';
import tokenService from './token.service.js';
import userService from './user.service.js';

export { authService, emailService, tokenService, userService };
