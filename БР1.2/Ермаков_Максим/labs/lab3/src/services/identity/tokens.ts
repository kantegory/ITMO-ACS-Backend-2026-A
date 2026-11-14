import jwt, { JwtPayload } from 'jsonwebtoken';
import { SETTINGS } from '../../common/settings';
import { UserRole } from '../../common/enums';
import { User } from './user.entity';

export interface JwtPayloadWithUser extends JwtPayload {
    user: {
        id: string;
        role: UserRole;
    };
}

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
        tokenType: 'Bearer',
        expiresIn: SETTINGS.JWT_ACCESS_TOKEN_LIFETIME,
    };
};

export const verifyAccessToken = (authorizationOrToken: string) => {
    const token = authorizationOrToken.startsWith('Bearer ')
        ? authorizationOrToken.split(' ')[1]
        : authorizationOrToken;

    return jwt.verify(token, SETTINGS.JWT_SECRET_KEY) as JwtPayloadWithUser;
};
