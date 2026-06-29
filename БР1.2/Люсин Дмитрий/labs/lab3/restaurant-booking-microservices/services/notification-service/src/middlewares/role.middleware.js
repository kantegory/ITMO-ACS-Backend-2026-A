const ApiError = require('../utils/apiError');

const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return next(new ApiError(403, 'Недостаточно прав'));
  }

  return next();
};

module.exports = requireRole;
