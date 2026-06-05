import { User } from "../entities/User";

export const toUser = (u: User) => ({
  id: String(u.id),
  email: u.email,
  name: u.name,
  phone: u.phone ?? null,
  role: u.role,
  created_at: u.createdAt,
});
