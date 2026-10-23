import crypto from 'crypto';
import { Role } from '@jobsearch/common';
import { sign } from '../keys';

export const ACCESS_LIFETIME = parseInt(process.env.JWT_ACCESS_TOKEN_LIFETIME || '900');
export const REFRESH_DAYS = parseInt(process.env.JWT_REFRESH_TOKEN_LIFETIME_DAYS || '14');
export const CODE_TTL_MINUTES = parseInt(process.env.VERIFICATION_CODE_TTL_MINUTES || '15');

export const sha256 = (v: string): string => crypto.createHash('sha256').update(v).digest('hex');
export const generateRefreshToken = (): string => crypto.randomBytes(32).toString('hex');
export const generateCode = (): string => crypto.randomInt(0, 1000000).toString().padStart(6, '0');
export const signAccessToken = (u: { id: string; role: Role }): string => sign({ typ: 'user', user: { id: u.id, role: u.role } }, ACCESS_LIFETIME);
export const addMinutes = (d: Date, m: number) => new Date(d.getTime() + m * 60000);
export const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 86400000);
