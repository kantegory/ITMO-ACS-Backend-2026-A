import { IsNull, MoreThan } from 'typeorm';

import SETTINGS from '../config/settings';
import dataSource from '../config/data-source';
import { User } from '../models/user.entity';
import { VerificationToken } from '../models/verification-token.entity';
import { TokenType } from '../models/enums';
import { addMinutes, generateCode, sha256 } from '../utils/tokens';
import { sendMail } from '../utils/mailer';

const SUBJECTS: Record<TokenType, string> = {
    [TokenType.EMAIL_VERIFICATION]: 'Подтверждение email',
    [TokenType.PASSWORD_CHANGE]: 'Подтверждение смены пароля',
};

// Создаёт одноразовый код, сохраняет в БД только его хеш и отправляет письмо
export const issueCode = async (user: User, type: TokenType) => {
    const code = generateCode();
    const repo = dataSource.getRepository(VerificationToken);

    await repo.save(
        repo.create({
            userId: user.id,
            type,
            codeHash: sha256(code),
            expiresAt: addMinutes(new Date(), SETTINGS.VERIFICATION_CODE_TTL_MINUTES),
        }),
    );

    sendMail(
        user.email,
        SUBJECTS[type],
        `Ваш код: ${code}. Он действует ${SETTINGS.VERIFICATION_CODE_TTL_MINUTES} минут.`,
    );
};

// Проверяет код. Если он верный и не просрочен, помечает использованным и возвращает true 
export const consumeCode = async (
    userId: string,
    type: TokenType,
    code: string,
): Promise<boolean> => {
    const repo = dataSource.getRepository(VerificationToken);

    const token = await repo.findOne({
        where: {
            userId,
            type,
            codeHash: sha256(code),
            usedAt: IsNull(),
            expiresAt: MoreThan(new Date()),
        },
    });
    if (!token) return false;

    // после успеха все ещё не использованные коды этого типа перестают действовать
    await repo.update({ userId, type, usedAt: IsNull() }, { usedAt: new Date() });
    return true;
};
