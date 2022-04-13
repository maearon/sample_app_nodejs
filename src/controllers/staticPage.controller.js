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

module.exports = {
  home,
};
