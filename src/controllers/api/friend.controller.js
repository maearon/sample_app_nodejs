import Friend from '../../models/friend.model.js';
import User from '../../models/user.model.js';
import FriendRequest from '../../models/friend_request.model.js';

export const sendFriendRequest = async (req, res) => {
  try {
    const { to, message } = req.body;

    const from = req.user._id;

    if (from === to) {
      return res.status(400).json({ message: 'Không thể gửi lời mời kết bạn cho chính mình' });
    }

    const userExists = await User.exists({ _id: to });

    if (!userExists) {
      return res.status(404).json({ message: 'Người dùng không tồn tại' });
    }

    let userA = from.toString();
    let userB = to.toString();

    if (userA > userB) {
      [userA, userB] = [userB, userA];
    }

    const [alreadyFriends, existingRequest] = await Promise.all([
      Friend.findOne({ userA, userB }),
      FriendRequest.findOne({
        $or: [
          { from, to },
          { from: to, to: from },
        ],
      }),
    ]);

    if (alreadyFriends) {
      return res.status(400).json({ message: 'Hai người đã là bạn bè' });
    }

    if (existingRequest) {
      return res.status(400).json({ message: 'Đã có lời mời kết bạn đang chờ' });
    }

    const request = await FriendRequest.create({
      from,
      to,
      message,
    });

    return res.status(201).json({ message: 'Gửi lời mời kết bạn thành công', request });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Lỗi khi gửi yêu cầu kết bạn', error);
    return res.status(500).json({ message: 'Lỗi hệ thống' });
  }
};

export const acceptFriendRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user._id;

    const request = await FriendRequest.findById(requestId);

    if (!request) {
      return res.status(404).json({ message: 'Không tìm thấy lời mời kết bạn' });
    }

    if (request.to.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Bạn không có quyền chấp nhận lời mời này' });
    }

    // eslint-disable-next-line no-unused-vars
    const friend = await Friend.create({
      userA: request.from,
      userB: request.to,
    });

    await FriendRequest.findByIdAndDelete(requestId);

    const from = await User.findById(request.from).select('_id displayName avatarUrl').lean();

    return res.status(200).json({
      message: 'Chấp nhận lời mời kết bạn thành công',
      newFriend: {
        _id: from?._id,
        displayName: from?.displayName,
        avatarUrl: from?.avatarUrl,
      },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Lỗi khi chấp nhận lời mời kết bạn', error);
    return res.status(500).json({ message: 'Lỗi hệ thống' });
  }
};

export const declineFriendRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user._id;

    const request = await FriendRequest.findById(requestId);

    if (!request) {
      return res.status(404).json({ message: 'Không tìm thấy lời mời kết bạn' });
    }

    if (request.to.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Bạn không có quyền từ chối lời mời này' });
    }

    await FriendRequest.findByIdAndDelete(requestId);

    return res.sendStatus(204);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Lỗi khi từ chối lời mời kết bạn', error);
    return res.status(500).json({ message: 'Lỗi hệ thống' });
  }
};

// export const getAllFriends = async (req, res) => {
//   try {
//     const userId = req.user._id;

//     const friendships = await Friend.find({
//       $or: [
//         {
//           userA: userId,
//         },
//         {
//           userB: userId,
//         },
//       ],
//     })
//       .populate('userA', '_id displayName avatarUrl')
//       .populate('userB', '_id displayName avatarUrl')
//       .lean();

//     if (!friendships.length) {
//       return res.status(200).json({ friends: [] });
//     }

//     const friends = friendships.map((f) => (f.userA._id.toString() === userId.toString() ? f.userB : f.userA));

//     return res.status(200).json({ friends });
//   } catch (error) {
//     // eslint-disable-next-line no-console
//     console.error('Lỗi khi lấy danh sách bạn bè', error);
//     return res.status(500).json({ message: 'Lỗi hệ thống' });
//   }
// };
export const getAllFriends = async (req, res) => {
  try {
    const userId = req.user._id;
    const q = req.query.q?.toLowerCase() || null;

    const friendships = await Friend.find({
      $or: [{ userA: userId }, { userB: userId }],
    })
      .populate('userA')
      .populate('userB')
      .lean();

    if (!friendships.length) {
      return res.status(200).json({ friends: [] });
    }

    let friends = friendships.map((f) => (f.userA._id.toString() === userId.toString() ? f.userB : f.userA));

    // 🟩 Nếu có query → filter theo name, username, displayName, email
    if (q) {
      const normalize = (str = '') =>
        str
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '');

      const query = normalize(q);

      friends = friends.filter((u) => {
        const name = normalize(u.name);
        const displayName = normalize(u.displayName);
        const username = normalize(u.username);
        const email = normalize(u.email);

        return name.includes(query) || displayName.includes(query) || username.includes(query) || email.includes(query);
      });
    }

    // Giới hạn 10 bạn
    friends = friends.slice(0, 10);

    // Loại bỏ password
    friends = friends.map((u) => {
      const { password, ...rest } = u;
      return rest;
    });

    return res.status(200).json({ friends });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Lỗi khi lấy danh sách bạn bè', error);
    return res.status(500).json({ message: 'Lỗi hệ thống' });
  }
};

export const getFriendRequests = async (req, res) => {
  try {
    const userId = req.user._id;

    const populateFields = '_id username displayName avatarUrl';

    const [sent, received] = await Promise.all([
      FriendRequest.find({ from: userId }).populate('to', populateFields),
      FriendRequest.find({ to: userId }).populate('from', populateFields),
    ]);

    res.status(200).json({ sent, received });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Lỗi khi lấy danh sách yêu cầu kết bạn', error);
    return res.status(500).json({ message: 'Lỗi hệ thống' });
  }
};
