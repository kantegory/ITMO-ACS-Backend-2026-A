import { User } from '../models';

const id = (value: string | number | null | undefined): number | null =>
  value === null || value === undefined ? null : Number(value);

export interface UserCounters {
  recipesCount?: number;
  followersCount?: number;
  followingCount?: number;
}

export const publicUserView = (user: User, counters: UserCounters = {}) => ({
  id: id(user.id),
  username: user.username,
  fullName: user.fullName ?? null,
  bio: user.bio ?? null,
  avatarUrl: user.avatarUrl ?? null,
  recipesCount: counters.recipesCount ?? 0,
  followersCount: counters.followersCount ?? 0,
  followingCount: counters.followingCount ?? 0,
  createdAt: user.createdAt,
});

export const userProfileView = (user: User, counters: UserCounters = {}) => ({
  ...publicUserView(user, counters),
  email: user.email,
  role: user.role,
  isActive: user.isActive,
});

/** Компактное представление для межсервисных вызовов /internal/users. */
export const internalUserView = (user: User) => ({
  id: id(user.id),
  username: user.username,
  fullName: user.fullName ?? null,
  avatarUrl: user.avatarUrl ?? null,
  isActive: user.isActive,
});
