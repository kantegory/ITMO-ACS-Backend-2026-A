const jwt = require('jsonwebtoken');
const ApiError = require('../utils/apiError');

const authMiddleware = (req, res, next) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return next(new ApiError(401, 'Необходима авторизация'));
  }

  const token = header.replace('Bearer ', '').trim();

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || 'restaurant_booking_microservices_secret');
    return next();
  } catch (error) {
    return next(new ApiError(401, 'Недействительный токен'));
  }
};

module.exports = authMiddleware;
