const jwt = require('jsonwebtoken');

const createToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'restaurant_booking_microservices_secret',
    { expiresIn: '7d' }
  );
};

module.exports = { createToken };
