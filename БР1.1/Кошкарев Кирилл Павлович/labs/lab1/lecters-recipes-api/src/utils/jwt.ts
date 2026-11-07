import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { unauthorized } from './errors';

export interface TokenPayload {
  sub: string;
  username: string;
  role: string;
  type: 'access' | 'refresh';
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
}

export const issueTokens = (user: { id: string; username: string; role: string }): TokenPair => {
  const base = { sub: String(user.id), username: user.username, role: user.role };
  return {
    accessToken: jwt.sign({ ...base, type: 'access' }, env.jwt.secret, { expiresIn: env.jwt.accessTtl }),
    refreshToken: jwt.sign({ ...base, type: 'refresh' }, env.jwt.secret, { expiresIn: env.jwt.refreshTtl }),
    expiresIn: env.jwt.accessTtl,
    tokenType: 'Bearer',
  };
};

export const verifyToken = (token: string, expected: 'access' | 'refresh' = 'access'): TokenPayload => {
  try {
    const payload = jwt.verify(token, env.jwt.secret) as TokenPayload;
    if (payload.type !== expected) {
      throw unauthorized('Передан токен неподходящего типа');
    }
    return payload;
  } catch (error) {
    if (error instanceof Error && error.name === 'AppError') throw error;
    throw unauthorized('Токен недействителен или истёк');
  }
};
