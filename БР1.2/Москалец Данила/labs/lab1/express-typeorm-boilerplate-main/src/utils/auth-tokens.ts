import jwt from 'jsonwebtoken';

import SETTINGS from '../config/settings';
import { User } from '../models/user.entity';

export interface AuthPayload {
    user: {
        id: number;
        role: string;
    };
}

export function signAccessToken(user: User): string {
    return jwt.sign(
        {
            user: {
                id: user.id,
                role: user.role,
            },
        },
        SETTINGS.JWT_SECRET_KEY,
        {
            expiresIn: SETTINGS.JWT_ACCESS_TOKEN_LIFETIME,
        },
    );
}

export function signRefreshToken(user: User): string {
    return jwt.sign(
        {
            user: {
                id: user.id,
                role: user.role,
            },
        },
        SETTINGS.JWT_REFRESH_SECRET_KEY,
        {
            expiresIn: SETTINGS.JWT_REFRESH_TOKEN_LIFETIME,
        },
    );
}
