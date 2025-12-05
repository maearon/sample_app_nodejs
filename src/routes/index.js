/* eslint-disable import/extensions */
import express from 'express';
import root from './root.route.js';
import apiFriendRoute from './friend.route.js';
import apiMessageRoute from './message.route.js';
import apiConversationRoute from './conversation.route.js';
import apiTaskRoute from './task.route.js';
import apiAuthRoute from './v1/auth.route.js';
import apiUserRoute from './v1/user.route.js';
import docsRoute from './v1/docs.route.js';
import config from '../config/config.js';

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
  {
    path: '/v1/friends',
    route: apiFriendRoute,
  },
  {
    path: '/v1/messages',
    route: apiMessageRoute,
  },
  {
    path: '/v1/conversations',
    route: apiConversationRoute,
  },
  {
    path: '/api/tasks',
    route: apiTaskRoute,
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
