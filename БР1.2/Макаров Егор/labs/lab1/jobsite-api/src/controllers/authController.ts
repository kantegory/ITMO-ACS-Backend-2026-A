import { Request, Response } from 'express';
import { repos } from '../repos';
import { hashPassword, verifyPassword } from '../utils/password';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { HttpError } from '../utils/httpError';
import { env } from '../config/env';
import { UserRole } from '../entities/enums';
import { presentUser } from '../presenters';
import { User } from '../entities/User';

const buildAuthResponse = (user: User) => ({
  access_token: signAccessToken({ sub: user.id, role: user.role }),
  refresh_token: signRefreshToken({ sub: user.id, role: user.role }),
  token_type: 'Bearer',
  expires_in: env.jwt.accessExpiresIn,
  user: presentUser(user),
});

export const register = async (req: Request, res: Response): Promise<void> => {
  const { email, password, role, first_name, last_name } = req.body;

  const exists = await repos.user().findOne({ where: { email } });
  if (exists) throw HttpError.conflict('Email уже зарегистрирован');

  const user = repos.user().create({
    email,
    passwordHash: await hashPassword(password),
    role,
  });
  await repos.user().save(user);

  if (role === UserRole.SEEKER) {
    const seeker = repos.jobSeeker().create({
      userId: user.id,
      firstName: first_name,
      lastName: last_name,
    });
    await repos.jobSeeker().save(seeker);
  } else if (role === UserRole.EMPLOYER) {
    const employer = repos.employer().create({ userId: user.id });
    await repos.employer().save(employer);
  }

  res.status(201).json(buildAuthResponse(user));
};

export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;
  const user = await repos.user().findOne({ where: { email } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    throw HttpError.unauthorized('Неверный email или пароль');
  }
  res.json(buildAuthResponse(user));
};

export const refresh = async (req: Request, res: Response): Promise<void> => {
  const { refresh_token } = req.body;
  let payload;
  try {
    payload = verifyRefreshToken(refresh_token);
  } catch {
    throw HttpError.unauthorized('refresh-токен недействителен или истёк');
  }
  const user = await repos.user().findOne({ where: { id: payload.sub } });
  if (!user) throw HttpError.unauthorized('Пользователь не найден');
  res.json(buildAuthResponse(user));
};
