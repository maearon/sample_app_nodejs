const express = require('express');
const staticPage = require('./staticPage.route');
const authRoute = require('./v1/auth.route');
const userRoute = require('./v1/user.route');
const docsRoute = require('./v1/docs.route');
const config = require('../config/config');

const router = express.Router();

const defaultRoutes = [
  {
    path: '/v1/auth',
    route: authRoute,
  },
  {
    path: '/v1/users',
    route: userRoute,
  },
  {
    path: '/',
    route: staticPage,
  },
];

const devRoutes = [
  // routes available only in development mode
  {
    path: '/rails/info/routes',
    route: docsRoute,
  },
];

defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

/* istanbul ignore next */
if (config.env === 'development') {
  devRoutes.forEach((route) => {
    router.use(route.path, route.route);
  });
}

module.exports = router;
