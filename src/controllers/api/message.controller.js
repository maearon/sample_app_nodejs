import Conversation from '../../models/conversation.model.js';
import Message from '../../models/message.model.js';
import { updateConversationAfterCreateMessage, emitNewMessage } from '../../utils/message.js';
import { getIO } from '../../socket/index.js';

export const sendDirectMessage = async (req, res) => {
  try {
    const io = getIO();
    const { recipientId, content, conversationId } = req.body;
    const senderId = req.user._id;

    if (!content) {
      return res.status(400).json({ message: 'Thiếu nội dung' });
    }

    let conversation = conversationId ? await Conversation.findById(conversationId) : null;

    // Tạo conversation mới
    if (!conversation) {
      conversation = await Conversation.create({
        type: 'direct',
        participants: [
          { userId: senderId, joinedAt: new Date() },
          { userId: recipientId, joinedAt: new Date() },
        ],
        unreadCounts: new Map(),
        lastMessageAt: new Date(),
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
    // eslint-disable-next-line no-console
    console.error('Lỗi gửi tin nhắn direct', error);
    return res.status(500).json({ message: 'Lỗi hệ thống' });
  }
};

export const sendGroupMessage = async (req, res) => {
  const io = getIO();
  try {
    const { conversationId, content } = req.body;
    const senderId = req.user._id;

    if (!content) {
      return res.status(400).json('Thiếu nội dung');
    }

    const { conversation } = req;

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
    // eslint-disable-next-line no-console
    console.error('Lỗi gửi tin nhắn group', error);
    return res.status(500).json({ message: 'Lỗi hệ thống' });
  }
};
