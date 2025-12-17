/* eslint-disable no-console */
import Conversation from '../../models/conversation.model.js';
import Message from '../../models/message.model.js';
import { emitNewMessage, updateConversationAfterCreateMessage } from '../../utils/message.js';
// import { io } from '../../socket/index.js';
import { getIO } from '../../socket/index.js';

export const sendDirectMessage = async (req, res) => {
  const io = getIO();
  try {
    const { recipientId, content, conversationId } = req.body;
    const senderId = req.user._id;

    let conversation;

    if (!content) {
      return res.status(400).json({ message: 'Thiếu nội dung' });
    }

    if (conversationId) {
      conversation = await Conversation.findById(conversationId);
    }

    if (!conversation) {
      conversation = await Conversation.create({
        type: 'direct',
        participants: [
          { userId: senderId, joinedAt: new Date() },
          { userId: recipientId, joinedAt: new Date() },
        ],
        lastMessageAt: new Date(),
        unreadCounts: new Map(),
      });
    }

    const message = await Message.create({
      conversationId: conversation._id,
      senderId,
      content,
    });

    updateConversationAfterCreateMessage(conversation, message, senderId);

    await conversation.save();

    emitNewMessage(io, conversation, message);

    return res.status(201).json({ message });
  } catch (error) {
    console.error('Lỗi xảy ra khi gửi tin nhắn trực tiếp', error);
    return res.status(500).json({ message: 'Lỗi hệ thống' });
  }
};

export const sendGroupMessage = async (req, res) => {
  const io = getIO();
  try {
    const { conversationId, content } = req.body;
    const senderId = req.user._id;
    const { conversation } = req;

    if (!content) {
      return res.status(400).json('Thiếu nội dung');
    }

    const message = await Message.create({
      conversationId,
      senderId,
      content,
    });

    updateConversationAfterCreateMessage(conversation, message, senderId);

    await conversation.save();
    emitNewMessage(io, conversation, message);

    return res.status(201).json({ message });
  } catch (error) {
    console.error('Lỗi xảy ra khi gửi tin nhắn nhóm', error);
    return res.status(500).json({ message: 'Lỗi hệ thống' });
  }
};
