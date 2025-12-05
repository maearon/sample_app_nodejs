import express from 'express';
import { createConversation, getConversations, getMessages } from '../controllers/api/conversation.controller.js';
import { checkFriendship } from '../middlewares/friend.js';
import auth from '../middlewares/auth.js';

const router = express.Router();

router.post('/', auth(), checkFriendship, createConversation);
router.get('/', auth(), getConversations);
router.get('/:conversationId/messages', auth(), getMessages);

export default router;
