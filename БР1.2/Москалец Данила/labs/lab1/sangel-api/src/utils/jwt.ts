import jwt from 'jsonwebtoken';
import { settings } from '../config/settings';

export interface JwtPayload {
  userId: number;
  email: string;
  role: string;
}

export function generateAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, settings.jwt.accessSecret, {
    expiresIn: settings.jwt.accessExpiresIn,
  });
}

export function generateRefreshToken(payload: JwtPayload): string {
  return jwt.sign(payload, settings.jwt.refreshSecret, {
    expiresIn: settings.jwt.refreshExpiresIn,
  });
}

export function verifyAccessToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, settings.jwt.accessSecret) as JwtPayload;
  } catch {
    return null;
  }
}

export function verifyRefreshToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, settings.jwt.refreshSecret) as JwtPayload;
  } catch {
    return null;
  }
}