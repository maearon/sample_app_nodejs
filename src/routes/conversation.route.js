import express from 'express';
import { createConversation, getConversations, getMessages } from '../controllers/api/conversation.controller.js';

import { checkFriendship } from '../middlewares/friend.js';
import auth from '../middlewares/auth.js';

const router = express.Router();

/**
 * Tạo conversation:
 * - private → cần checkFriendship
 * - group   → bỏ qua checkFriendship
 */
router.post(
  '/',
  auth(),
  (req, res, next) => {
    if (req.body?.type === 'private') {
      return checkFriendship(req, res, next);
    }
    return next();
  },
  createConversation,
);

router.get('/', auth(), getConversations);
router.get('/:conversationId/messages', auth(), getMessages);

export default router;
