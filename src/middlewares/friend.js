import Conversation from '../models/conversation.model.js';
import Friend from '../models/friend.model.js';

const pair = (a, b) => (a < b ? [a, b] : [b, a]);

// helper để lấy id string
const getId = (val) => {
  if (!val) return null;
  if (typeof val === 'string') return val;
  return val.userId ?? val._id ?? val.id ?? null;
};

export const checkFriendship = async (req, res, next) => {
  try {
    const me = req.user._id.toString();
    const recipientId = getId(req.body?.recipientId);
    const rawMemberIds = req.body?.memberIds ?? [];

    const memberIds = rawMemberIds.map(getId);

    if (!recipientId && memberIds.length === 0) {
      return res.status(400).json({ message: 'Cần cung cấp recipientId hoặc memberIds' });
    }

    // --- 1-1 CHAT ---
    if (recipientId) {
      const [userA, userB] = pair(me, recipientId);

      const isFriend = await Friend.findOne({ userA, userB });

      if (!isFriend) {
        return res.status(403).json({ message: 'Bạn chưa kết bạn với người này' });
      }

      return next();
    }

    // --- GROUP CHAT ---
    const friendChecks = memberIds.map(async (mId) => {
      const [userA, userB] = pair(me, mId);
      const friend = await Friend.findOne({ userA, userB });
      return friend ? null : mId;
    });

    const results = await Promise.all(friendChecks);
    const notFriends = results.filter(Boolean);

    if (notFriends.length > 0) {
      return res.status(403).json({
        message: 'Bạn chỉ có thể thêm bạn bè vào nhóm.',
        notFriends,
      });
    }

    next();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Lỗi checkFriendship:', error);
    return res.status(500).json({ message: 'Lỗi hệ thống' });
  }
};

export const checkGroupMembership = async (req, res, next) => {
  try {
    const { conversationId } = req.body;
    const userId = req.user._id.toString();

    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({ message: 'Không tìm thấy cuộc trò chuyện' });
    }

    const isMember = conversation.participants.some((p) => {
      const pid = p.userId?.toString() ?? p._id?.toString() ?? p.id?.toString() ?? null;

      return pid === userId;
    });

    if (!isMember) {
      return res.status(403).json({ message: 'Bạn không ở trong group này.' });
    }

    req.conversation = conversation;

    next();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Lỗi checkGroupMembership:', error);
    return res.status(500).json({ message: 'Lỗi hệ thống' });
  }
};
