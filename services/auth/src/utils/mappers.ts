import { User } from "../entities/User";

export const toUser = (u: User) => ({
  id: u.id,
  email: u.email,
  role: u.role,
  full_name: u.fullName,
  created_at: u.createdAt,
});

export const toUserInternal = (u: User) => ({
  id: u.id,
  email: u.email,
  role: u.role,
  full_name: u.fullName,
});
