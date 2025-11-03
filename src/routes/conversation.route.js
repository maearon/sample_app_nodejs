import express from 'express';
import { createConversation, getConversations, getMessages } from '../controllers/api/conversation.controller.js';
import { checkFriendship } from '../middlewares/friend.js';

const router = express.Router();

router.post('/', checkFriendship, createConversation);
router.get('/', getConversations);
router.get('/:conversationId/messages', getMessages);

export default router;
