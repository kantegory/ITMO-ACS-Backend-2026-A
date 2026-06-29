const bcrypt = require('bcryptjs');
const { User } = require('../models');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');
const { createToken } = require('../utils/tokens');
const { toUserResponse } = require('../views/user.view');

const register = asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body;

  if (!name || !email || !password) {
    throw new ApiError(400, 'Имя, email и пароль обязательны');
  }

  const existingUser = await User.findOne({ where: { email } });

  if (existingUser) {
    throw new ApiError(409, 'Пользователь с такой почтой уже существует');
  }

  const password_hash = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, phone, password_hash, role: 'user' });
  const token = createToken(user);

  res.status(201).json({ token, user: toUserResponse(user) });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, 'Email и пароль обязательны');
  }

  const user = await User.findOne({ where: { email } });

  if (!user) {
    throw new ApiError(401, 'Неверный email или пароль');
  }

  const isPasswordValid = await bcrypt.compare(password, user.password_hash);

  if (!isPasswordValid) {
    throw new ApiError(401, 'Неверный email или пароль');
  }

  const token = createToken(user);

  res.json({ token, user: toUserResponse(user) });
});

const me = asyncHandler(async (req, res) => {
  res.json({ user: toUserResponse(req.user) });
});

module.exports = { register, login, me };
