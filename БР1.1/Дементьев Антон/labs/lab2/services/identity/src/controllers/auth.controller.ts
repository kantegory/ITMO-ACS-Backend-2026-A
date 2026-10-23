import { Body, JsonController, Post, Req, Res, UseBefore } from 'routing-controllers';
import { Response } from 'express';
import { IsNull } from 'typeorm';
import { created, dispatchSoon, fail, isUniqueViolation, noContent, TokenType } from '@jobsearch/common';

import { dataSource } from '../db';
import { LoginDto, LogoutDto, PasswordChangeConfirmDto, PasswordChangeRequestDto, RefreshDto, RegisterDto, ResendVerificationDto, VerifyEmailDto } from '../dto/auth.dto';
import { authMiddleware, RequestWithUser } from '../auth';
import { RefreshToken } from '../models/refresh-token.entity';
import { UserProfile } from '../models/user-profile.entity';
import { User } from '../models/user.entity';
import { consumeCode, createCode, issueTokenPair, revokeAllTokens } from '../services/auth.service';
import checkPassword from '../utils/check-password';
import hashPassword from '../utils/hash-password';
import { sha256 } from '../utils/tokens';
import { userView } from '../views/user.view';

const normalizeEmail = (email: string) => email.trim().toLowerCase();

@JsonController('/api/v1/auth')
class AuthController {
    private users = () => dataSource.getRepository(User);

    @Post('/register')
    async register(@Body({ type: RegisterDto }) body: RegisterDto, @Res() res: Response) {
        const email = normalizeEmail(body.email);
        if (await this.users().existsBy({ email })) throw fail('EMAIL_ALREADY_EXISTS');
        let user: User;
        try {
            // аккаунт, профиль, код и событие для Notification — в одной транзакции
            user = await dataSource.transaction(async (m) => {
                const saved = await m.save(m.create(User, { email, role: body.role, password: hashPassword(body.password) }));
                await m.save(m.create(UserProfile, { userId: saved.id, lastName: body.last_name, firstName: body.first_name, middleName: body.middle_name ?? null }));
                await createCode(m, saved, TokenType.EMAIL_VERIFICATION);
                return saved;
            });
        } catch (error) {
            if (isUniqueViolation(error)) throw fail('EMAIL_ALREADY_EXISTS');
            throw error;
        }
        dispatchSoon();
        return created(res, '/users/me', userView(user));
    }

    @Post('/verify-email')
    async verifyEmail(@Body({ type: VerifyEmailDto }) body: VerifyEmailDto, @Res() res: Response) {
        const user = await this.users().findOneBy({ email: normalizeEmail(body.email) });
        if (!user) throw fail('INVALID_CODE');
        if (user.isVerified) throw fail('EMAIL_ALREADY_VERIFIED');
        if (!(await consumeCode(user.id, TokenType.EMAIL_VERIFICATION, body.code))) throw fail('INVALID_CODE');
        await this.users().update(user.id, { isVerified: true });
        return noContent(res);
    }

    @Post('/verify-email/resend')
    async resend(@Body({ type: ResendVerificationDto }) body: ResendVerificationDto, @Res() res: Response) {
        const user = await this.users().findOneBy({ email: normalizeEmail(body.email) });
        if (user && !user.isVerified) { await dataSource.transaction((m) => createCode(m, user, TokenType.EMAIL_VERIFICATION)); dispatchSoon(); }
        return noContent(res);
    }

    @Post('/login')
    async login(@Body({ type: LoginDto }) body: LoginDto) {
        const user = await this.users().findOneBy({ email: normalizeEmail(body.email) });
        if (!user || !checkPassword(user.password, body.password)) throw fail('INVALID_CREDENTIALS');
        if (!user.isVerified) throw fail('EMAIL_NOT_VERIFIED');
        if (!user.isActive) throw fail('ACCOUNT_DISABLED');
        return issueTokenPair(user);
    }

    @Post('/refresh')
    async refresh(@Body({ type: RefreshDto }) body: RefreshDto) {
        const repo = dataSource.getRepository(RefreshToken);
        const token = await repo.findOne({ where: { tokenHash: sha256(body.refresh_token) }, relations: { user: true } });
        if (!token || token.revokedAt || token.expiresAt <= new Date()) throw fail('INVALID_REFRESH_TOKEN');
        if (!token.user.isActive) throw fail('ACCOUNT_DISABLED');
        await repo.update(token.id, { revokedAt: new Date() });
        return issueTokenPair(token.user);
    }

    @Post('/logout')
    @UseBefore(authMiddleware)
    async logout(@Req() req: RequestWithUser, @Body({ type: LogoutDto }) body: LogoutDto, @Res() res: Response) {
        await dataSource.getRepository(RefreshToken).update({ userId: req.user!.id, tokenHash: sha256(body.refresh_token), revokedAt: IsNull() }, { revokedAt: new Date() });
        return noContent(res);
    }

    @Post('/logout-all')
    @UseBefore(authMiddleware)
    async logoutAll(@Req() req: RequestWithUser, @Res() res: Response) {
        await revokeAllTokens(req.user!.id);
        return noContent(res);
    }

    @Post('/password/change-request')
    @UseBefore(authMiddleware)
    async requestPasswordChange(@Req() req: RequestWithUser, @Body({ type: PasswordChangeRequestDto }) body: PasswordChangeRequestDto, @Res() res: Response) {
        const user = await this.users().findOneByOrFail({ id: req.user!.id });
        if (!checkPassword(user.password, body.current_password)) throw fail('INVALID_CURRENT_PASSWORD');
        await dataSource.transaction((m) => createCode(m, user, TokenType.PASSWORD_CHANGE));
        dispatchSoon();
        return noContent(res);
    }

    @Post('/password/change-confirm')
    @UseBefore(authMiddleware)
    async confirmPasswordChange(@Req() req: RequestWithUser, @Body({ type: PasswordChangeConfirmDto }) body: PasswordChangeConfirmDto, @Res() res: Response) {
        const userId = req.user!.id;
        if (!(await consumeCode(userId, TokenType.PASSWORD_CHANGE, body.code))) throw fail('INVALID_CODE');
        await this.users().update(userId, { password: hashPassword(body.new_password) });
        await revokeAllTokens(userId);
        return noContent(res);
    }
}
export default AuthController;
