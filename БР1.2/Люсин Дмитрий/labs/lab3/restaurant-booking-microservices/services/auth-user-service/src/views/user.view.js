const userView = (user) => {
  if (!user) return null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    is_active: user.is_active,
    created_at: user.created_at || user.createdAt,
    updated_at: user.updated_at || user.updatedAt
  };
};

module.exports = { userView };
