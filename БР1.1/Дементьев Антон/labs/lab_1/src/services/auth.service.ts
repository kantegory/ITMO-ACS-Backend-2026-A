import { IsNull } from 'typeorm';

import SETTINGS from '../config/settings';
import dataSource from '../config/data-source';
import { RefreshToken } from '../models/refresh-token.entity';
import { User } from '../models/user.entity';
import {
    addDays,
    generateRefreshToken,
    sha256,
    signAccessToken,
} from '../utils/tokens';

// Выдаёт пару токенов: access (JWT, живёт пару минут) и refresh (живёт пару дней, в БД - хеш)
export const issueTokenPair = async (user: User) => {
    const refresh = generateRefreshToken();
    const repo = dataSource.getRepository(RefreshToken);

    await repo.save(
        repo.create({
            userId: user.id,
            tokenHash: sha256(refresh),
            expiresAt: addDays(new Date(), SETTINGS.JWT_REFRESH_TOKEN_LIFETIME_DAYS),
        }),
    );

    return {
        access_token: signAccessToken(user),
        refresh_token: refresh,
        token_type: 'Bearer',
        expires_in: SETTINGS.JWT_ACCESS_TOKEN_LIFETIME,
    };
};

// Отзывает все действующие refresh-токены пользователя (выход на всех устройствах)
export const revokeAllTokens = async (userId: string) => {
    await dataSource
        .getRepository(RefreshToken)
        .update({ userId, revokedAt: IsNull() }, { revokedAt: new Date() });
};
