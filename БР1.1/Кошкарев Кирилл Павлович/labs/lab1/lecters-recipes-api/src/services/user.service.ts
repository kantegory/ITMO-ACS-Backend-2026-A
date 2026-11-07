import { ILike } from 'typeorm';
import { AppDataSource } from '../config/data-source';
import { Follow, Recipe, RecipeStatus, User } from '../models';
import { UpdateUserInput } from '../dto';
import { badRequest, conflict, notFound } from '../utils/errors';
import { hashPassword } from '../utils/password';
import { buildMeta, PageParams, Paginated } from '../utils/pagination';
import { UserCounters } from '../views';

const users = () => AppDataSource.getRepository(User);
const follows = () => AppDataSource.getRepository(Follow);
const recipes = () => AppDataSource.getRepository(Recipe);

export const userService = {
  async getById(id: string): Promise<User> {
    const user = await users().findOne({ where: { id } });
    if (!user) throw notFound('Пользователь не найден');
    return user;
  },

  /** Счётчики публикаций и подписок для карточки профиля. */
  async counters(userId: string): Promise<UserCounters> {
    const [recipesCount, followersCount, followingCount] = await Promise.all([
      recipes().count({ where: { authorId: userId, status: RecipeStatus.PUBLISHED } }),
      follows().count({ where: { followingId: userId } }),
      follows().count({ where: { followerId: userId } }),
    ]);
    return { recipesCount, followersCount, followingCount };
  },

  async update(id: string, input: UpdateUserInput): Promise<User> {
    const user = await this.getById(id);
    if (input.fullName !== undefined) user.fullName = input.fullName ?? null;
    if (input.bio !== undefined) user.bio = input.bio ?? null;
    if (input.avatarUrl !== undefined) user.avatarUrl = input.avatarUrl ?? null;
    if (input.password) user.passwordHash = await hashPassword(input.password);
    return users().save(user);
  },

  async search(q: string | undefined, params: PageParams): Promise<Paginated<User>> {
    const where = q ? [{ username: ILike(`%${q}%`) }, { fullName: ILike(`%${q}%`) }] : {};
    const [data, total] = await users().findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: params.skip,
      take: params.take,
    });
    return { data, meta: buildMeta(total, params) };
  },

  async follow(followerId: string, followingId: string): Promise<void> {
    if (followerId === followingId) {
      throw badRequest('Нельзя подписаться на самого себя');
    }
    await this.getById(followingId);
    const existing = await follows().findOne({ where: { followerId, followingId } });
    if (existing) throw conflict('Подписка уже оформлена');
    await follows().save(follows().create({ followerId, followingId }));
  },

  async unfollow(followerId: string, followingId: string): Promise<void> {
    const existing = await follows().findOne({ where: { followerId, followingId } });
    if (!existing) throw notFound('Подписка не найдена');
    await follows().remove(existing);
  },

  async followers(userId: string, params: PageParams): Promise<Paginated<User>> {
    await this.getById(userId);
    const [rows, total] = await follows().findAndCount({
      where: { followingId: userId },
      relations: { follower: true },
      order: { createdAt: 'DESC' },
      skip: params.skip,
      take: params.take,
    });
    return { data: rows.map((row) => row.follower), meta: buildMeta(total, params) };
  },

  async following(userId: string, params: PageParams): Promise<Paginated<User>> {
    await this.getById(userId);
    const [rows, total] = await follows().findAndCount({
      where: { followerId: userId },
      relations: { following: true },
      order: { createdAt: 'DESC' },
      skip: params.skip,
      take: params.take,
    });
    return { data: rows.map((row) => row.following), meta: buildMeta(total, params) };
  },

  async followingIds(userId: string): Promise<string[]> {
    const rows = await follows().find({ where: { followerId: userId } });
    return rows.map((row) => String(row.followingId));
  },
};
