/* eslint-disable no-console */
/* eslint-disable no-param-reassign */
import mongoose from 'mongoose';
import Conversation from '../models/conversation.model.js';
import Friend from '../models/friend.model.js';

const toObjectId = (id) => new mongoose.Types.ObjectId(id);

// Sắp xếp id theo thứ tự để lưu cặp bạn bè
const pair = (a, b) => {
  a = a.toString();
  b = b.toString();
  return a.localeCompare(b) < 0 ? [a, b] : [b, a];
};

// Lấy id từ mọi dạng (string, object, mongoose doc)
const getId = (val) => {
  if (!val) return null;
  if (typeof val === 'string') return val;
  return val.userId ?? val._id ?? val.id ?? null;
};

export const checkFriendship = async (req, res, next) => {
  try {
    const me = req.user._id.toString();
    const recipientId = getId(req.body?.recipientId);

    console.log('=== CHECK FRIENDSHIP DEBUG ===');
    console.log('me         =', me);
    console.log('recipient  =', recipientId);
    console.log('pair       =', pair(me, recipientId));

    if (!recipientId) return next();

    const [userA, userB] = pair(me, recipientId);

    const doc = await Friend.findOne({
      userA: toObjectId(userA),
      userB: toObjectId(userB),
    });

    console.log('DB FOUND?  =', doc);

    if (!doc) {
      return res.status(403).json({ message: 'Bạn chưa kết bạn với người này' });
    }

    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi hệ thống' });
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
    console.error('Lỗi checkGroupMembership:', error);
    res.status(500).json({ message: 'Lỗi hệ thống' });
  }
};
