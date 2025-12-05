import Conversation from '../../models/conversation.model.js';
import Message from '../../models/message.model.js';

/**
 * 🟢 Tạo conversation (direct / group)
 */
export const createConversation = async (req, res) => {
  try {
    const { type, name, memberIds } = req.body;
    const userId = req.user._id;

    if (!type || !memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
      return res.status(400).json({ message: 'Thiếu dữ liệu tạo conversation' });
    }

    let conversation;

    // 🟢 Direct conversation (2 người)
    if (type === 'direct') {
      const partnerId = memberIds[0];

      // Kiểm tra xem đã có direct chat chưa
      conversation = await Conversation.findOne({
        type: 'direct',
        'participants.userId': { $all: [userId, partnerId] },
        $expr: { $eq: [{ $size: '$participants' }, 2] },
      });

      // Nếu chưa có → tạo mới
      if (!conversation) {
        conversation = await Conversation.create({
          type: 'direct',
          participants: [{ userId }, { userId: partnerId }],
          lastMessageAt: new Date(),
        });
      }
    }

    // 🟢 Group conversation
    if (type === 'group') {
      if (!name) {
        return res.status(400).json({ message: 'Tên nhóm là bắt buộc' });
      }

      conversation = await Conversation.create({
        type: 'group',
        participants: [{ userId }, ...memberIds.map((id) => ({ userId: id }))],
        group: {
          name,
          createdBy: userId,
        },
        lastMessageAt: new Date(),
      });
    }

    if (!conversation) {
      return res.status(400).json({ message: 'Loại conversation không hợp lệ' });
    }

    await conversation.populate([
      { path: 'participants.userId', select: 'displayName avatarUrl' },
      { path: 'seenBy', select: 'displayName avatarUrl' },
      { path: 'lastMessage.senderId', select: 'displayName avatarUrl' },
    ]);

    return res.status(201).json({ conversation });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('❌ Lỗi khi tạo conversation', error);
    return res.status(500).json({ message: 'Lỗi hệ thống' });
  }
};

/**
 * 🟢 Get conversations của user
 */
export const getConversations = async (req, res) => {
  try {
    const userId = req.user._id;

    const conversations = await Conversation.find({
      'participants.userId': userId,
    })
      .sort({ lastMessageAt: -1 })
      .populate({
        path: 'participants.userId',
        select: 'displayName avatarUrl',
      })
      .populate({
        path: 'lastMessage.senderId',
        select: 'displayName avatarUrl',
      })
      .populate({
        path: 'seenBy',
        select: 'displayName avatarUrl',
      });

    const formatted = conversations.map((c) => ({
      ...c.toObject(),
      unreadCounts: c.unreadCounts || {},
      participants: c.participants?.map((p) => ({
        _id: p.userId?._id,
        displayName: p.userId?.displayName,
        avatarUrl: p.userId?.avatarUrl || null,
        joinedAt: p.joinedAt,
      })),
    }));

    return res.status(200).json({ conversations: formatted });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('❌ Lỗi lấy danh sách conversation', error);
    return res.status(500).json({ message: 'Lỗi hệ thống' });
  }
};

/**
 * 🟢 Get messages trong conversation theo cursor pagination
 */
export const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { limit = 50, cursor } = req.query;

    const query = { conversationId };

    if (cursor) {
      query.createdAt = { $lt: new Date(cursor) };
    }

    // Lấy limit + 1 message để kiểm tra còn trang sau hay không
    let messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit) + 1);

    let nextCursor = null;

    if (messages.length > Number(limit)) {
      const nextMsg = messages[messages.length - 1];
      nextCursor = nextMsg.createdAt.toISOString();
      messages.pop();
    }

    messages = messages.reverse();

    return res.status(200).json({ messages, nextCursor });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('❌ Lỗi lấy messages', error);
    return res.status(500).json({ message: 'Lỗi hệ thống' });
  }
};

/**
 * 🟢 Lấy danh sách conversationId của user → dùng cho Socket.IO join room
 */
export const getUserConversationForSocketIO = async (userId) => {
  try {
    const conversations = await Conversation.find({ 'participants.userId': userId }, { _id: 1 });

    return conversations.map((c) => c._id.toString());
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('❌ Lỗi lấy conversation cho socket', error);
    return [];
  }
};
