import { EntityManager, IsNull, MoreThan } from 'typeorm';
import { publishEvent, TokenType } from '@jobsearch/common';

import { dataSource } from '../db';
import { RefreshToken } from '../models/refresh-token.entity';
import { User } from '../models/user.entity';
import { VerificationToken } from '../models/verification-token.entity';
import { ACCESS_LIFETIME, addDays, addMinutes, CODE_TTL_MINUTES, generateCode, generateRefreshToken, REFRESH_DAYS, sha256, signAccessToken } from '../utils/tokens';

export const issueTokenPair = async (user: User) => {
    const refresh = generateRefreshToken();
    const repo = dataSource.getRepository(RefreshToken);
    await repo.save(repo.create({ userId: user.id, tokenHash: sha256(refresh), expiresAt: addDays(new Date(), REFRESH_DAYS) }));
    return { access_token: signAccessToken(user), refresh_token: refresh, token_type: 'Bearer', expires_in: ACCESS_LIFETIME };
};

export const revokeAllTokens = async (userId: string) => {
    await dataSource.getRepository(RefreshToken).update({ userId, revokedAt: IsNull() }, { revokedAt: new Date() });
};

// Код сохраняется (хеш) и одновременно ставится в очередь событие для Notification: одна транзакция
export const createCode = async (m: EntityManager, user: User, type: TokenType) => {
    const code = generateCode();
    await m.insert(VerificationToken, { userId: user.id, type, codeHash: sha256(code), expiresAt: addMinutes(new Date(), CODE_TTL_MINUTES) });
    await publishEvent(m, 'identity.email_requested', { user_id: user.id, to_email: user.email, template: type, code, ttl_minutes: CODE_TTL_MINUTES });
};

export const consumeCode = async (userId: string, type: TokenType, code: string): Promise<boolean> => {
    const repo = dataSource.getRepository(VerificationToken);
    const token = await repo.findOne({ where: { userId, type, codeHash: sha256(code), usedAt: IsNull(), expiresAt: MoreThan(new Date()) } });
    if (!token) return false;
    await repo.update({ userId, type, usedAt: IsNull() }, { usedAt: new Date() });
    return true;
};
