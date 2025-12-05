import express from 'express';
import auth from '../middlewares/auth.js';

import { sendDirectMessage, sendGroupMessage } from '../controllers/api/message.controller.js';
import { checkFriendship, checkGroupMembership } from '../middlewares/friend.js';

const router = express.Router();

router.post('/direct', auth(), checkFriendship, sendDirectMessage);
router.post('/group', auth(), checkGroupMembership, sendGroupMessage);

export default router;
