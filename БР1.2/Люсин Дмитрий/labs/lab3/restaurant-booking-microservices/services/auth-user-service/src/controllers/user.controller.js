const { User } = require('../models');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');
const { userView } = require('../views/user.view');

const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.user.id);

  if (!user || !user.is_active) {
    throw new ApiError(404, 'Пользователь не найден');
  }

  res.json({ user: userView(user) });
});

const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.user.id);

  if (!user || !user.is_active) {
    throw new ApiError(404, 'Пользователь не найден');
  }

  const { name, phone } = req.body;

  if (name !== undefined) user.name = name;
  if (phone !== undefined) user.phone = phone;

  await user.save();

  res.json({ user: userView(user) });
});

const getInternalUser = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.params.userId);

  if (!user || !user.is_active) {
    throw new ApiError(404, 'Пользователь не найден');
  }

  res.json(userView(user));
});

const checkUserExists = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.params.userId);

  if (!user || !user.is_active) {
    throw new ApiError(404, 'Пользователь не найден');
  }

  res.json({ exists: true, user_id: user.id, role: user.role });
});

module.exports = { getProfile, updateProfile, getInternalUser, checkUserExists };
