import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

import SETTINGS from '../config/settings';
import { fail } from '../common/errors';
import { Role } from '../models/enums';

export interface AuthUser {
    id: string;
    role: Role;
}

export interface RequestWithUser extends Request {
    user?: AuthUser;
    requestId?: string;
}

// Достаёт пользователя из заголовка Authorization: Bearer <токен>.
// Возвращает null, если токена нет; бросает ошибку, если токен плохой.
const readUser = (request: Request): AuthUser | null => {
    const header = request.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) return null;

    const token = header.slice('Bearer '.length).trim();
    if (!token) return null;

    try {
        const payload = jwt.verify(token, SETTINGS.JWT_SECRET_KEY) as any;
        if (!payload?.user?.id || !payload?.user?.role) throw new Error('bad');
        return { id: payload.user.id, role: payload.user.role };
    } catch (error: any) {
        if (error?.name === 'TokenExpiredError') throw fail('TOKEN_EXPIRED');
        throw fail('UNAUTHORIZED');
    }
};

// Обязательная авторизация: без действующего токена — 401.
const authMiddleware = (
    request: RequestWithUser,
    _response: Response,
    next: NextFunction,
) => {
    try {
        const user = readUser(request);
        if (!user) throw fail('UNAUTHORIZED');
        request.user = user;
        next();
    } catch (error) {
        next(error);
    }
};

// Необязательная авторизация: публичный эндпоинт, который знает пользователя, если он вошёл.
export const optionalAuthMiddleware = (
    request: RequestWithUser,
    _response: Response,
    next: NextFunction,
) => {
    try {
        const user = readUser(request);
        if (user) request.user = user;
    } catch (_error) {
        // плохой токен на публичном эндпоинте просто игнорируем
    }
    next();
};

// Проверка роли: requireRole(Role.EMPLOYER) пропустит только работодателей (иначе 403).
export const requireRole =
    (...roles: Role[]) =>
    (request: RequestWithUser, _response: Response, next: NextFunction) => {
        if (!request.user) return next(fail('UNAUTHORIZED'));
        if (!roles.includes(request.user.role)) return next(fail('FORBIDDEN'));
        next();
    };

export default authMiddleware;
