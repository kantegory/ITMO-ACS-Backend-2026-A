const toUserResponse = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
  created_at: user.created_at,
  updated_at: user.updated_at,
});

module.exports = { toUserResponse };
