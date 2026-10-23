import { Body, JsonController, Post, Req, Res, UseBefore } from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';
import { Response } from 'express';
import { IsNull } from 'typeorm';

import dataSource from '../config/data-source';
import { fail } from '../common/errors';
import { created, noContent } from '../common/http';
import { isUniqueViolation } from '../common/validators';
import {
    LoginDto,
    LogoutDto,
    PasswordChangeConfirmDto,
    PasswordChangeRequestDto,
    RefreshDto,
    RegisterDto,
    ResendVerificationDto,
    VerifyEmailDto,
} from '../dto/auth.dto';
import authMiddleware, { RequestWithUser } from '../middlewares/auth.middleware';
import rateLimit from '../middlewares/rate-limit.middleware';
import { RefreshToken } from '../models/refresh-token.entity';
import { TokenType } from '../models/enums';
import { UserProfile } from '../models/user-profile.entity';
import { User } from '../models/user.entity';
import { issueTokenPair, revokeAllTokens } from '../services/auth.service';
import { consumeCode, issueCode } from '../services/verification.service';
import checkPassword from '../utils/check-password';
import hashPassword from '../utils/hash-password';
import { sha256 } from '../utils/tokens';
import { userView } from '../views/user.view';

const AUTH = { security: [{ bearerAuth: [] }] };
const normalizeEmail = (email: string) => email.trim().toLowerCase();

@JsonController('/auth')
class AuthController {
    private users = () => dataSource.getRepository(User);

    @Post('/register')
    @UseBefore(rateLimit)
    @OpenAPI({ summary: 'Регистрация' })
    async register(@Body({ type: RegisterDto }) body: RegisterDto, @Res() res: Response) {
        const email = normalizeEmail(body.email);

        if (await this.users().existsBy({ email })) throw fail('EMAIL_ALREADY_EXISTS');

        let user: User;
        try {
            // аккаунт и профиль создаются вместе: либо оба, либо ни одного
            user = await dataSource.transaction(async (manager) => {
                const saved = await manager.save(
                    manager.create(User, {
                        email,
                        role: body.role,
                        password: hashPassword(body.password),
                    }),
                );
                await manager.save(
                    manager.create(UserProfile, {
                        userId: saved.id,
                        lastName: body.last_name,
                        firstName: body.first_name,
                        middleName: body.middle_name ?? null,
                    }),
                );
                return saved;
            });
        } catch (error) {
            if (isUniqueViolation(error)) throw fail('EMAIL_ALREADY_EXISTS');
            throw error;
        }

        await issueCode(user, TokenType.EMAIL_VERIFICATION);
        return created(res, '/users/me', userView(user));
    }

    @Post('/verify-email')
    @UseBefore(rateLimit)
    @OpenAPI({ summary: 'Подтверждение email' })
    async verifyEmail(@Body({ type: VerifyEmailDto }) body: VerifyEmailDto, @Res() res: Response) {
        const user = await this.users().findOneBy({ email: normalizeEmail(body.email) });
        if (!user) throw fail('INVALID_CODE');
        if (user.isVerified) throw fail('EMAIL_ALREADY_VERIFIED');

        const ok = await consumeCode(user.id, TokenType.EMAIL_VERIFICATION, body.code);
        if (!ok) throw fail('INVALID_CODE');

        await this.users().update(user.id, { isVerified: true });
        return noContent(res);
    }

    @Post('/verify-email/resend')
    @UseBefore(rateLimit)
    @OpenAPI({ summary: 'Повторная отправка кода подтверждения email' })
    async resendVerification(@Body({ type: ResendVerificationDto }) body: ResendVerificationDto, @Res() res: Response) {
        const user = await this.users().findOneBy({ email: normalizeEmail(body.email) });
        // ответ всегда 204: так нельзя узнать, зарегистрирован ли email
        if (user && !user.isVerified) await issueCode(user, TokenType.EMAIL_VERIFICATION);
        return noContent(res);
    }

    @Post('/login')
    @UseBefore(rateLimit)
    @OpenAPI({ summary: 'Вход в систему' })
    async login(@Body({ type: LoginDto }) body: LoginDto) {
        const user = await this.users().findOneBy({ email: normalizeEmail(body.email) });

        // одинаковая ошибка и для «нет такого email», и для «неверный пароль»
        if (!user || !checkPassword(user.password, body.password)) {
            throw fail('INVALID_CREDENTIALS');
        }
        if (!user.isVerified) throw fail('EMAIL_NOT_VERIFIED');
        if (!user.isActive) throw fail('ACCOUNT_DISABLED');

        return issueTokenPair(user);
    }

    @Post('/refresh')
    @OpenAPI({ summary: 'Обновление токенов' })
    async refresh(@Body({ type: RefreshDto }) body: RefreshDto) {
        const repo = dataSource.getRepository(RefreshToken);
        const token = await repo.findOne({
            where: { tokenHash: sha256(body.refresh_token) },
            relations: { user: true },
        });

        if (!token || token.revokedAt || token.expiresAt <= new Date()) {
            throw fail('INVALID_REFRESH_TOKEN');
        }
        if (!token.user.isActive) throw fail('ACCOUNT_DISABLED');

        // ротация: старый refresh-токен отзывается, выдаётся новая пара
        await repo.update(token.id, { revokedAt: new Date() });
        return issueTokenPair(token.user);
    }

    @Post('/logout')
    @UseBefore(authMiddleware)
    @OpenAPI({ summary: 'Выход на текущем устройстве', ...AUTH })
    async logout(@Req() req: RequestWithUser, @Body({ type: LogoutDto }) body: LogoutDto, @Res() res: Response) {
        await dataSource.getRepository(RefreshToken).update(
            { userId: req.user!.id, tokenHash: sha256(body.refresh_token), revokedAt: IsNull() },
            { revokedAt: new Date() },
        );
        return noContent(res);
    }

    @Post('/logout-all')
    @UseBefore(authMiddleware)
    @OpenAPI({ summary: 'Выход на всех устройствах', ...AUTH })
    async logoutAll(@Req() req: RequestWithUser, @Res() res: Response) {
        await revokeAllTokens(req.user!.id);
        return noContent(res);
    }

    @Post('/password/change-request')
    @UseBefore(authMiddleware, rateLimit)
    @OpenAPI({ summary: 'Запрос смены пароля (код придёт на email)', ...AUTH })
    async requestPasswordChange(
        @Req() req: RequestWithUser,
        @Body({ type: PasswordChangeRequestDto }) body: PasswordChangeRequestDto,
        @Res() res: Response,
    ) {
        const user = await this.users().findOneByOrFail({ id: req.user!.id });
        if (!checkPassword(user.password, body.current_password)) {
            throw fail('INVALID_CURRENT_PASSWORD');
        }
        await issueCode(user, TokenType.PASSWORD_CHANGE);
        return noContent(res);
    }

    @Post('/password/change-confirm')
    @UseBefore(authMiddleware, rateLimit)
    @OpenAPI({ summary: 'Подтверждение смены пароля кодом из письма', ...AUTH })
    async confirmPasswordChange(
        @Req() req: RequestWithUser,
        @Body({ type: PasswordChangeConfirmDto }) body: PasswordChangeConfirmDto,
        @Res() res: Response,
    ) {
        const userId = req.user!.id;
        const ok = await consumeCode(userId, TokenType.PASSWORD_CHANGE, body.code);
        if (!ok) throw fail('INVALID_CODE');

        await this.users().update(userId, { password: hashPassword(body.new_password) });
        // после смены пароля все сессии завершаются
        await revokeAllTokens(userId);
        return noContent(res);
    }
}

export default AuthController;
