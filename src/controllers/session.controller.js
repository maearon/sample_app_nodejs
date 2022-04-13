const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');

const login = catchAsync(async (req, res) => {
  const locals = {
    title: 'Welcome to the Sample App',
    description: 'Page Description',
    header: 'Page Header',
  };
  res.status(httpStatus.OK).render('sessions/new', locals);
});

const create = (req, res) => {
  res.render('static_pages/help');
};

const destroy = (req, res) => {
  res.render('static_pages/about');
};

module.exports = {
  login,
  create,
  destroy,
};
