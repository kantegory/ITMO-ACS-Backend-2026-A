const ApiError = require('../utils/apiError');

const notFoundHandler = (req, res, next) => {
  next(new ApiError(404, 'Маршрут не найден'));
};

const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    statusCode,
    error: statusCode >= 500 ? 'Internal Server Error' : 'Request Error',
    message: err.message || 'Внутренняя ошибка сервера',
    details: err.details || null
  });
};

module.exports = { notFoundHandler, errorHandler };
