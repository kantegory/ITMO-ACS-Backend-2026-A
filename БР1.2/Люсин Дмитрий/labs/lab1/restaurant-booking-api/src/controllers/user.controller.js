const { User } = require('../models');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');
const { toUserResponse } = require('../views/user.view');

const getProfile = asyncHandler(async (req, res) => {
  res.json({ user: toUserResponse(req.user) });
});

const updateProfile = asyncHandler(async (req, res) => {
  const { name, email, phone } = req.body;

  if (email && email !== req.user.email) {
    const existingUser = await User.findOne({ where: { email } });

    if (existingUser) {
      throw new ApiError(409, 'Новая почта уже занята');
    }
  }

  await req.user.update({
    name: name ?? req.user.name,
    email: email ?? req.user.email,
    phone: phone ?? req.user.phone,
  });

  res.json({ user: toUserResponse(req.user) });
});

module.exports = { getProfile, updateProfile };
