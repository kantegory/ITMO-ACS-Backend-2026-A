import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ILike, In } from 'typeorm';
import { AppDataSource } from '../config/data-source';
import { env } from '../config/env';
import { Follow, User } from '../models';
import { LoginInput, RegisterInput, UpdateUserInput } from '../dto';
import {
  badRequest, conflict, invalidCredentials, notFound, unauthorized,
} from '../utils/errors';
import { buildMeta, PageParams, Paginated } from '../utils/pagination';
import { verifyToken } from '../utils/jwt';
import { userEvents } from '../messaging/publisher';

const users = () => AppDataSource.getRepository(User);
const follows = () => AppDataSource.getRepository(Follow);

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
}

const issueTokens = (user: User): TokenPair => {
  const base = { sub: String(user.id), username: user.username, role: user.role };
  return {
    accessToken: jwt.sign({ ...base, type: 'access' }, env.jwt.secret, { expiresIn: env.jwt.accessTtl }),
    refreshToken: jwt.sign({ ...base, type: 'refresh' }, env.jwt.secret, { expiresIn: env.jwt.refreshTtl }),
    expiresIn: env.jwt.accessTtl,
    tokenType: 'Bearer',
  };
};

export const userService = {
  async register(input: RegisterInput): Promise<{ user: User; tokens: TokenPair }> {
    const repo = users();
    const email = input.email.toLowerCase().trim();
    const username = input.username.trim();
    if (await repo.findOne({ where: { email } })) throw conflict('Пользователь с таким email уже существует');
    if (await repo.findOne({ where: { username } })) throw conflict('Пользователь с таким username уже существует');

    const saved = await repo.save(repo.create({
      email,
      username,
      passwordHash: await bcrypt.hash(input.password, 10),
      fullName: input.fullName ?? null,
    }));
    // событие подхватывает social-service и наполняет свою проекцию user_projection
    await userEvents.registered(saved);
    return { user: saved, tokens: issueTokens(saved) };
  },

  async login(input: LoginInput): Promise<{ user: User; tokens: TokenPair }> {
    const user = await users().createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.email = :email', { email: input.email.toLowerCase().trim() })
      .getOne();
    if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) throw invalidCredentials();
    if (!user.isActive) throw unauthorized('Учётная запись заблокирована');
    return { user, tokens: issueTokens(user) };
  },

  async refresh(refreshToken: string): Promise<TokenPair> {
    const payload = verifyToken(refreshToken, env.jwt.secret, 'refresh');
    const user = await users().findOne({ where: { id: payload.sub } });
    if (!user || !user.isActive) throw unauthorized('Пользователь не найден или заблокирован');
    return issueTokens(user);
  },

  async getById(id: string): Promise<User> {
    const user = await users().findOne({ where: { id } });
    if (!user) throw notFound('Пользователь не найден');
    return user;
  },

  async counters(userId: string) {
    const [followersCount, followingCount] = await Promise.all([
      follows().count({ where: { followingId: userId } }),
      follows().count({ where: { followerId: userId } }),
    ]);
    return { followersCount, followingCount };
  },

  async update(id: string, input: UpdateUserInput): Promise<User> {
    const user = await this.getById(id);
    if (input.fullName !== undefined) user.fullName = input.fullName ?? null;
    if (input.bio !== undefined) user.bio = input.bio ?? null;
    if (input.avatarUrl !== undefined) user.avatarUrl = input.avatarUrl ?? null;
    if (input.password) user.passwordHash = await bcrypt.hash(input.password, 10);
    const saved = await users().save(user);
    await userEvents.updated(saved);
    return saved;
  },

  async search(q: string | undefined, params: PageParams): Promise<Paginated<User>> {
    const [data, total] = await users().findAndCount({
      where: q ? [{ username: ILike(`%${q}%`) }, { fullName: ILike(`%${q}%`) }] : {},
      order: { createdAt: 'DESC' },
      skip: params.skip,
      take: params.take,
    });
    return { data, meta: buildMeta(total, params) };
  },

  byIds: (ids: string[]) => users().find({ where: { id: In(ids) } }),

  async follow(followerId: string, followingId: string): Promise<void> {
    if (followerId === followingId) throw badRequest('Нельзя подписаться на самого себя');
    await this.getById(followingId);
    if (await follows().findOne({ where: { followerId, followingId } })) {
      throw conflict('Подписка уже оформлена');
    }
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
      where: { followingId: userId }, relations: { follower: true },
      order: { createdAt: 'DESC' }, skip: params.skip, take: params.take,
    });
    return { data: rows.map((row) => row.follower), meta: buildMeta(total, params) };
  },

  async following(userId: string, params: PageParams): Promise<Paginated<User>> {
    await this.getById(userId);
    const [rows, total] = await follows().findAndCount({
      where: { followerId: userId }, relations: { following: true },
      order: { createdAt: 'DESC' }, skip: params.skip, take: params.take,
    });
    return { data: rows.map((row) => row.following), meta: buildMeta(total, params) };
  },

  async followingIds(userId: string): Promise<number[]> {
    const rows = await follows().find({ where: { followerId: userId } });
    return rows.map((row) => Number(row.followingId));
  },
};
