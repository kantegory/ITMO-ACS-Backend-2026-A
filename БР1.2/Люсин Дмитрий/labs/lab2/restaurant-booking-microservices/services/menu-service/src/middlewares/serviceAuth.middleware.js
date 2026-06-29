const ApiError = require('../utils/apiError');

const serviceAuthMiddleware = (req, res, next) => {
  const token = req.headers['x-service-token'];
  const expected = process.env.SERVICE_TOKEN || 'internal_service_token_123';

  if (!token || token !== expected) {
    return next(new ApiError(401, 'Недействительный сервисный токен'));
  }

  return next();
};

module.exports = serviceAuthMiddleware;
