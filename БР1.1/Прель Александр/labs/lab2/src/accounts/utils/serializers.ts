import { User } from "../entities";

const toIso = (value: Date | string) => (value instanceof Date ? value.toISOString() : new Date(value).toISOString());

export const toUserResponse = (user: User) => ({
  userId: user.userId,
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  phone: user.phone,
  createdAt: toIso(user.createdAt),
  updatedAt: toIso(user.updatedAt),
});
