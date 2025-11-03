import express from 'express';

import { sendDirectMessage, sendGroupMessage } from '../controllers/api/message.controller';
import { checkFriendship, checkGroupMembership } from '../middlewares/friend.js';

const router = express.Router();

router.post('/direct', checkFriendship, sendDirectMessage);
router.post('/group', checkGroupMembership, sendGroupMessage);

export default router;
