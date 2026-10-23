import crypto from 'crypto';
import jwt from 'jsonwebtoken';

import SETTINGS from '../config/settings';
import { Role } from '../models/enums';

// SHA-256: в БД мы храним только хеши токенов и кодов, а не сами значения
export const sha256 = (value: string): string =>
    crypto.createHash('sha256').update(value).digest('hex');

// Случайный refresh-токен (64 символа)
export const generateRefreshToken = (): string =>
    crypto.randomBytes(32).toString('hex');

// Одноразовый код из 6 цифр для писем
export const generateCode = (): string =>
    crypto.randomInt(0, 1000000).toString().padStart(6, '0');

// Короткоживущий access-токен (JWT)
export const signAccessToken = (user: { id: string; role: Role }): string =>
    jwt.sign({ user: { id: user.id, role: user.role } }, SETTINGS.JWT_SECRET_KEY, {
        expiresIn: SETTINGS.JWT_ACCESS_TOKEN_LIFETIME,
    });

export const addMinutes = (date: Date, minutes: number): Date =>
    new Date(date.getTime() + minutes * 60 * 1000);

export const addDays = (date: Date, days: number): Date =>
    new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
