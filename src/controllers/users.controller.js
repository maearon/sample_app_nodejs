import httpStatus from 'http-status';
// import pick from '../utils/pick';
// import ApiError from '../utils/ApiError';
import catchAsync from '../utils/catchAsync';
import { userService } from '../services';

const index = (req, res) => {
  res.render('users/index');
};

const show = (req, res) => {
  res.render('users/show');
};

const following = (req, res) => {
  res.render('users/show_follow');
};

const followers = (req, res) => {
  res.render('users/show_follow');
};

const newUser = catchAsync(async (req, res) => {
  res.render('users/new');
});

const create = catchAsync(async (req, res) => {
  const user = await userService.createUser(req.body);
  res.status(httpStatus.CREATED).send(user);
});

const edit = catchAsync(async (req, res) => {
  res.render('users/edit');
});

const update = catchAsync(async (req, res) => {
  const user = await userService.updateUserById(req.params.userId, req.body);
  res.send(user);
});

const destroy = catchAsync(async (req, res) => {
  await userService.deleteUserById(req.params.userId);
  res.status(httpStatus.NO_CONTENT).send();
});

export { index, show, newUser, create, edit, update, destroy, following, followers };
