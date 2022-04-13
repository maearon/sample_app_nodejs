const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');

const home = catchAsync(async (req, res) => {
  const locals = {
    title: 'Page Title',
    description: 'Page Description',
    header: 'Page Header',
  };
  res.status(httpStatus.OK).render('static_pages/home', locals);
});

const help = (req, res) => {
  res.render('static_pages/help');
};

const about = (req, res) => {
  res.render('static_pages/about');
};

const contact = (req, res) => {
  res.render('static_pages/contact');
};

module.exports = {
  home,
  help,
  about,
  contact,
};
