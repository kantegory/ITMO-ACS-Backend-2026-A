import jwt from 'jsonwebtoken';
import { JWT_SECRET } from './config';

export type TokenPayload = { id: number; email: string };

export function signToken(user: TokenPayload): string {
  return jwt.sign(user, JWT_SECRET, { expiresIn: '2h' });
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
}
