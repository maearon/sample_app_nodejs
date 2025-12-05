import express from 'express';
import auth from '../middlewares/auth.js';

import {
  acceptFriendRequest,
  sendFriendRequest,
  declineFriendRequest,
  getAllFriends,
  getFriendRequests,
} from '../controllers/api/friend.controller.js';

const router = express.Router();

router.post('/requests', auth(), sendFriendRequest);

router.post('/requests/:requestId/accept', auth(), acceptFriendRequest);
router.post('/requests/:requestId/decline', auth(), declineFriendRequest);

router.get('/', auth(), getAllFriends);
router.get('/requests', auth(), getFriendRequests);

export default router;
