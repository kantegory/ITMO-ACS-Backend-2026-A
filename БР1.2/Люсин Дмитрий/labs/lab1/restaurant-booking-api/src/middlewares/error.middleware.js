const ApiError = require('../utils/apiError');

const errorMiddleware = (error, req, res, next) => {
  if (error instanceof ApiError) {
    res.status(error.status).json({
      error: {
        message: error.message,
        details: error.details,
      },
    });
    return;
  }

  if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
    res.status(400).json({
      error: {
        message: 'Ошибка валидации данных',
        details: error.errors.map((item) => item.message),
      },
    });
    return;
  }

  res.status(500).json({
    error: {
      message: 'Внутренняя ошибка сервера',
      details: process.env.NODE_ENV === 'production' ? null : error.message,
    },
  });
};

module.exports = errorMiddleware;
