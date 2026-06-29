const jwt = require('jsonwebtoken');
const ApiError = require('../utils/apiError');
const { User } = require('../models');

const auth = async (req, res, next) => {
  try {
    const header = req.headers.authorization;

    if (!header || !header.startsWith('Bearer ')) {
      throw new ApiError(401, 'Требуется авторизация');
    }

    const token = header.split(' ')[1];
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');
    const user = await User.findByPk(payload.id);

    if (!user) {
      throw new ApiError(401, 'Пользователь не найден');
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof ApiError) {
      next(error);
      return;
    }

    next(new ApiError(401, 'Недействительный токен'));
  }
};

module.exports = auth;
