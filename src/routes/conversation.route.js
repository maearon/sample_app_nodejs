import express from 'express';
import {
  createConversation,
  getConversations,
  getMessages,
  markAsSeen,
} from '../controllers/api/conversation.controller.js';

import { checkFriendship } from '../middlewares/friend.js';
import auth from '../middlewares/auth.js';

const router = express.Router();

/**
 * Tạo conversation:
 * - private → cần checkFriendship
 * - group   → bỏ qua checkFriendship
 */
router.post('/', auth(), checkFriendship, createConversation);
router.get('/', auth(), getConversations);
router.get('/:conversationId/messages', auth(), getMessages);
router.get('/:conversationId/seen', auth(), markAsSeen);

export default router;
