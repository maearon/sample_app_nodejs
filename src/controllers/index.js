// module.exports.staticPageController = require('./staticPage.controller');
// module.exports.sessionController = require('./session.controller');
// module.exports.usersController = require('./users.controller');
// module.exports.passwordResetsController = require('./password_resets.controller');
// module.exports.authController = require('./api/auth.controller');
// module.exports.userController = require('./api/user.controller');

import staticPageController from './staticPage.controller';
import sessionController from './session.controller';
import usersController from './users.controller';
import userService from './password_resets.controller';
import authController from './api/auth.controller';
import userController from './api/user.controller';

export { staticPageController, sessionController, usersController, userService, authController, userController };
