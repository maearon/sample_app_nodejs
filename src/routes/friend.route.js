import express from 'express';
import auth from '../middlewares/auth.js';

import {
  acceptFriendRequest,
  acceptFriendRequestDiaLog,
  sendFriendRequest,
  declineFriendRequest,
  declineFriendRequestDiaLog,
  getAllFriends,
  getAllFriendsDiaLog,
  getFriendRequests,
  getFriendRequestsDiaLog,
  getFriendSuggestions,
} from '../controllers/api/friend.controller.js';

const router = express.Router();

router.post('/requests', auth(), sendFriendRequest);

router.post('/requests/:requestId/accept', auth(), acceptFriendRequest);
router.post('/requests/:requestId/decline', auth(), declineFriendRequest);
router.post('/requests/:requestId/accept/dialog', auth(), acceptFriendRequestDiaLog);
router.post('/requests/:requestId/decline/dialog', auth(), declineFriendRequestDiaLog);

router.get('/', auth(), getAllFriends);
router.get('/dialog', auth(), getAllFriendsDiaLog);
router.get('/requests', auth(), getFriendRequests);
router.get('/requests/dialog', auth(), getFriendRequestsDiaLog);
router.get('/suggestions', auth(), getFriendSuggestions);

export default router;
