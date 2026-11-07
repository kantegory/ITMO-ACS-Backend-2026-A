import { AppDataSource } from '../config/data-source';
import { User } from '../models';
import { LoginInput, RegisterInput } from '../dto';
import { conflict, invalidCredentials, unauthorized } from '../utils/errors';
import { hashPassword, verifyPassword } from '../utils/password';
import { issueTokens, TokenPair, verifyToken } from '../utils/jwt';

const users = () => AppDataSource.getRepository(User);

export const authService = {
  async register(input: RegisterInput): Promise<{ user: User; tokens: TokenPair }> {
    const repo = users();
    const email = input.email.toLowerCase().trim();
    const username = input.username.trim();

    if (await repo.findOne({ where: { email } })) {
      throw conflict('Пользователь с таким email уже существует');
    }
    if (await repo.findOne({ where: { username } })) {
      throw conflict('Пользователь с таким username уже существует');
    }

    const user = repo.create({
      email,
      username,
      passwordHash: await hashPassword(input.password),
      fullName: input.fullName ?? null,
    });
    const saved = await repo.save(user);
    return { user: saved, tokens: issueTokens({ ...saved, id: String(saved.id) }) };
  },

  async login(input: LoginInput): Promise<{ user: User; tokens: TokenPair }> {
    const user = await users()
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.email = :email', { email: input.email.toLowerCase().trim() })
      .getOne();

    if (!user || !(await verifyPassword(input.password, user.passwordHash))) {
      throw invalidCredentials();
    }
    if (!user.isActive) {
      throw unauthorized('Учётная запись заблокирована');
    }
    return { user, tokens: issueTokens({ ...user, id: String(user.id) }) };
  },

  async refresh(refreshToken: string): Promise<TokenPair> {
    const payload = verifyToken(refreshToken, 'refresh');
    const user = await users().findOne({ where: { id: payload.sub } });
    if (!user || !user.isActive) {
      throw unauthorized('Пользователь не найден или заблокирован');
    }
    return issueTokens({ ...user, id: String(user.id) });
  },
};
