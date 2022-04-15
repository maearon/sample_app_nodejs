const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
// const { userService } = require('../services');
const { User } = require('../models');
const { authService } = require('../services');

const newSession = catchAsync(async (req, res) => {
  const locals = {
    title: 'Welcome to the Sample App',
    description: 'Page Description',
    header: 'Page Header',
  };
  res.status(httpStatus.OK).render('sessions/new', locals);
});

const create = catchAsync(async (req, res) => {
  // const user = await userService.createUser(req.body.session);
  const user = User.findOne(req.body.session.email.toLowerCase);
  if (user && user.PasswordDigest(...req.body.session.password)) {
    if (user.isEmailVerified?) {
      authService.loginUserWithEmailAndPassword(...req.body.session);
      req.body.session.remember_me == '1' ? remember(user) : forget(user);
      res.render('users/show', user);
    } else {
      message  = "Account not activated. ";
      message += "Check your email for the activation link.";
      // flash[:warning] = message;
      res.render('static_pages/home');
    }
  } else {
    // flash.now[:danger] = 'Invalid email/password combination'
    res.status(httpStatus.OK).render('sessions/new');
  }
  if (await User.isEmailTaken(userBody.email)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email has already been taken');
  }
  return User.create(userBody);
  res.render('static_pages/home', user);

});

const destroy = (req, res) => {
  res.render('static_pages/about');
};

module.exports = {
  newSession,
  create,
  destroy,
};
