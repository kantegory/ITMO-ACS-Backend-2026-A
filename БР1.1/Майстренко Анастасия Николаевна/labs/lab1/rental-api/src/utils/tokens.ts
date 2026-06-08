import jwt from 'jsonwebtoken';
import SETTINGS from '../config/settings';
import { User } from '../models/user.entity';

export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
    tokenType: string;
    expiresIn: number;
}

export function issueTokens(user: User): AuthTokens {
    const payload = { user: { id: user.id, role: user.role } };

    const accessToken = jwt.sign(payload, SETTINGS.JWT_SECRET_KEY, {
        expiresIn: SETTINGS.JWT_ACCESS_TOKEN_LIFETIME,
    });

    const refreshToken = jwt.sign(
        { ...payload, type: 'refresh' },
        SETTINGS.JWT_SECRET_KEY,
        { expiresIn: SETTINGS.JWT_REFRESH_TOKEN_LIFETIME },
    );

    return {
        accessToken,
        refreshToken,
        tokenType: SETTINGS.JWT_TOKEN_TYPE,
        expiresIn: SETTINGS.JWT_ACCESS_TOKEN_LIFETIME,
    };
}
