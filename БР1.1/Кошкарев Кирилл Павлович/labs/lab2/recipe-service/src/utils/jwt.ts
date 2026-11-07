import jwt from 'jsonwebtoken';
import { unauthorized } from './errors';

export interface TokenPayload {
  sub: string;
  username: string;
  role: string;
  type: 'access' | 'refresh';
}

/**
 * JWT подписывается общим секретом (JWT_SECRET), поэтому любой сервис может
 * самостоятельно проверить токен без обращения к user-service.
 */
export const verifyToken = (
  token: string,
  secret: string,
  expected: 'access' | 'refresh' = 'access',
): TokenPayload => {
  try {
    const payload = jwt.verify(token, secret) as TokenPayload;
    if (payload.type !== expected) throw unauthorized('Передан токен неподходящего типа');
    return payload;
  } catch (error) {
    if (error instanceof Error && error.name === 'AppError') throw error;
    throw unauthorized('Токен недействителен или истёк');
  }
};
