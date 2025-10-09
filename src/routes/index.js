import express from 'express';
import root from './root.route';
import apiAuthRoute from './v1/auth.route';
import apiUserRoute from './v1/user.route';
import docsRoute from './v1/docs.route';
import config from '../config/config';

const router = express.Router();

const defaultRoutes = [
  {
    path: '/v1/auth',
    route: apiAuthRoute,
  },
  {
    path: '/v1/users',
    route: apiUserRoute,
  },
  {
    path: '/',
    route: root,
  },
  // {
  //   path: '/users',
  //   route: staticPage,
  // },
];

const devRoutes = [
  // routes available only in development mode
  {
    path: '/express/info/routes',
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

export default router;
