import jwt from 'jsonwebtoken';
import SETTINGS from '../config/settings';
import { User } from '../models/user.entity';

export const buildAuthTokens = (user: User) => {
    const accessToken = jwt.sign(
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

    const refreshToken = jwt.sign(
        {
            user: {
                id: user.id,
                role: user.role,
            },
            type: 'refresh',
        },
        SETTINGS.JWT_REFRESH_SECRET_KEY,
        {
            expiresIn: SETTINGS.JWT_REFRESH_TOKEN_LIFETIME,
        },
    );

    return {
        accessToken,
        refreshToken,
        tokenType: SETTINGS.JWT_TOKEN_TYPE,
        expiresIn: SETTINGS.JWT_ACCESS_TOKEN_LIFETIME,
    };
};
