import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { UserRole } from '../entities/enums';

export interface TokenPayload {
  sub: number;
  role: UserRole;
}

export const signAccessToken = (payload: TokenPayload): string =>
  jwt.sign(payload, env.jwt.accessSecret, { expiresIn: env.jwt.accessExpiresIn });

export const signRefreshToken = (payload: TokenPayload): string =>
  jwt.sign(payload, env.jwt.refreshSecret, { expiresIn: env.jwt.refreshExpiresIn });

export const verifyAccessToken = (token: string): TokenPayload =>
  jwt.verify(token, env.jwt.accessSecret) as unknown as TokenPayload;

export const verifyRefreshToken = (token: string): TokenPayload =>
  jwt.verify(token, env.jwt.refreshSecret) as unknown as TokenPayload;
