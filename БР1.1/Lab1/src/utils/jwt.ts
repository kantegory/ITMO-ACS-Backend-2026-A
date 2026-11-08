import jwt from 'jsonwebtoken';

import SETTINGS from '../config/settings';

export const createAccessToken = (userId: number): string => {
    return jwt.sign(
        {
            user: {
                id: userId,
            },
        },
        SETTINGS.JWT_SECRET_KEY,
        {
            expiresIn: SETTINGS.JWT_ACCESS_TOKEN_LIFETIME,
        },
    );
};
