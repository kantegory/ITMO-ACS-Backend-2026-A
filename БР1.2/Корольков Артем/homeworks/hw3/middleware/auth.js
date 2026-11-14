const jwt = require('jsonwebtoken');
const { User } = require('../models');

const JWT_SECRET = process.env.JWT_SECRET || 'restaurant-api-dev-secret';

module.exports = async (req, res, next) => {
  try {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');

    if (scheme !== 'Bearer' || !token) {
      return res.status(401).json({ error: 'missing or invalid auth token' });
    }

    const payload = jwt.verify(token, JWT_SECRET);
    const user = await User.findByPk(payload.id);

    if (!user) {
      return res.status(401).json({ error: 'user not found' });
    }

    req.user = user;
    return next();
  } catch (error) {
    return res.status(401).json({ error: 'invalid or expired token' });
  }
};
