/* eslint-disable no-console */
import httpStatus from 'http-status';
// import { v2 as cloudinary } from 'cloudinary';
import pick from '../../utils/pick.js';
import ApiError from '../../utils/ApiError.js';
import catchAsync from '../../utils/catchAsync.js';
import { userService } from '../../services/index.js';
import { uploadImageFromBuffer } from '../../middlewares/upload.js';
import User from '../../models/user.model.js';

export const authMe = async (req, res) => {
  if (!req.user) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate 2');
  }
  try {
    const { user } = req; // lấy từ authMiddleware

    return res.status(200).json({
      user,
    });
  } catch (error) {
    console.error('Lỗi khi gọi authMe', error);
    return res.status(500).json({ message: 'Lỗi hệ thống' });
  }
};

export const uploadAvatar = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { file } = req;
    if (!file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // const user = await User.findById(req.user._id).select('avatarId');

    // ✅ XÓA ẢNH CŨ
    // if (user?.avatarId) {
    //   await cloudinary.uploader.destroy(user.avatarId);
    // }

    const publicId = `moji_chat/avatars/${req.user._id}`;

    // ✅ UPLOAD ẢNH MỚI
    // const result = await uploadImageFromBuffer(file.buffer);

    // ✅ UPDATE DB
    // user.avatarUrl = result.secure_url;
    // user.avatarId = result.public_id;
    // await user.save();

    // return res.status(200).json({ avatarUrl: user.avatarUrl });

    // ✅ UPLOAD + OVERWRITE
    const result = await uploadImageFromBuffer(file.buffer, {
      public_id: publicId,
      overwrite: true,
      invalidate: true, // 🔥 clear CDN cache
    });

    // ✅ UPDATE DB (KHÔNG cần avatarId nữa)
    await User.findByIdAndUpdate(req.user._id, {
      avatarUrl: result.secure_url,
    });

    return res.status(200).json({
      avatarUrl: result.secure_url,
    });
  } catch (error) {
    console.error('Upload avatar failed', error);
    return res.status(500).json({ message: 'Upload failed' });
  }
};

export const searchUserByUsername = async (req, res) => {
  try {
    const { username } = req.query;

    if (!username || username.trim() === '') {
      return res.status(400).json({ message: 'Cần cung cấp username trong query.' });
    }

    const user = await User.findOne({ username }).select('_id displayName username avatarUrl');

    return res.status(200).json({ user });
  } catch (error) {
    console.error('Lỗi xảy ra khi searchUserByUsername', error);
    return res.status(500).json({ message: 'Lỗi hệ thống' });
  }
};

const createUser = catchAsync(async (req, res) => {
  const user = await userService.createUser(req.body);
  res.status(httpStatus.CREATED).send(user);
});

const getUsers = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['name', 'role']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await userService.queryUsers(filter, options);
  res.send(result);
});

const getUser = catchAsync(async (req, res) => {
  const user = await userService.getUserById(req.params.userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  res.send(user);
});

const updateUser = catchAsync(async (req, res) => {
  const user = await userService.updateUserById(req.params.userId, req.body);
  res.send(user);
});

const deleteUser = catchAsync(async (req, res) => {
  await userService.deleteUserById(req.params.userId);
  res.status(httpStatus.NO_CONTENT).send();
});

export default { authMe, uploadAvatar, searchUserByUsername, createUser, getUsers, getUser, updateUser, deleteUser };
