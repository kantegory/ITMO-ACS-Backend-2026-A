import { User } from "./entities/User";

export function userPublic(u: User) {
  return {
    id: u.id,
    role: u.role,
    first_name: u.firstName,
    last_name: u.lastName,
    email: u.email,
    is_verified: u.isVerified,
    created_at: u.createdAt.toISOString(),
    updated_at: u.updatedAt.toISOString(),
  };
}

export function userBrief(u: User) {
  return {
    id: u.id,
    role: u.role,
    first_name: u.firstName,
    last_name: u.lastName,
  };
}
