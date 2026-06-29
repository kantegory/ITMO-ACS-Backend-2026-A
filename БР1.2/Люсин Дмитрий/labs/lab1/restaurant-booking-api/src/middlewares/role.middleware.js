const ApiError = require('../utils/apiError');

const permit = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    next(new ApiError(403, 'Недостаточно прав'));
    return;
  }

  next();
};

module.exports = permit;
