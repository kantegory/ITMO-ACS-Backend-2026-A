const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');
const { createToken } = require('../utils/tokens');
const { userView } = require('../views/user.view');

const register = asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body;

  if (!name || !email || !password) {
    throw new ApiError(400, 'Необходимо указать name, email и password');
  }

  const existing = await User.findOne({ where: { email } });

  if (existing) {
    throw new ApiError(409, 'Пользователь с такой почтой уже существует');
  }

  const password_hash = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, password_hash, phone, role: 'user' });
  const token = createToken(user);

  res.status(201).json({ token, user: userView(user) });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, 'Необходимо указать email и password');
  }

  const user = await User.findOne({ where: { email } });

  if (!user || !user.is_active) {
    throw new ApiError(401, 'Неверные данные для входа');
  }

  const isValid = await bcrypt.compare(password, user.password_hash);

  if (!isValid) {
    throw new ApiError(401, 'Неверные данные для входа');
  }

  const token = createToken(user);

  res.json({ token, user: userView(user) });
});

const me = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.user.id);

  if (!user || !user.is_active) {
    throw new ApiError(404, 'Пользователь не найден');
  }

  res.json({ user: userView(user) });
});

const verifyToken = asyncHandler(async (req, res) => {
  const { token } = req.body;

  if (!token) {
    throw new ApiError(400, 'Необходимо передать token');
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'restaurant_booking_microservices_secret');
    const user = await User.findByPk(payload.id);

    if (!user || !user.is_active) {
      throw new ApiError(401, 'Пользователь не активен');
    }

    res.json({ valid: true, user: userView(user) });
  } catch (error) {
    throw new ApiError(401, 'Недействительный токен');
  }
});

module.exports = { register, login, me, verifyToken };
