import { Body, HttpCode, Post, Res, Get, UseBefore } from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';
import { IsString, IsEmail, MinLength, IsOptional, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import jwt from 'jsonwebtoken';
import { Response } from 'express';
import { JsonController } from 'routing-controllers';

import SETTINGS from '../config/settings';
import { AuthUser } from '../models/auth-user.entity';
import checkPassword from '../utils/check-password';
import hashPassword from '../utils/hash-password';
import dataSource from '../config/data-source';
import serviceAuthMiddleware from '../middlewares/service-auth.middleware';

enum UserRole { LANDLORD = 'landlord', RENTER = 'renter' }

class RegisterDto {
    @IsString() @Type(() => String) first_name: string;
    @IsString() @Type(() => String) last_name: string;
    @IsEmail() @Type(() => String) email: string;
    @IsString() @MinLength(6) @Type(() => String) password: string;
    @IsString() @IsOptional() @Type(() => String) phone?: string;
    @IsEnum(UserRole) @IsOptional() role?: UserRole;
}

class LoginDto {
    @IsEmail() @Type(() => String) email: string;
    @IsString() @Type(() => String) password: string;
}

class RefreshDto {
    @IsString() @Type(() => String) refresh_token: string;
}

class ValidateDto {
    @IsString() @Type(() => String) token: string;
}

function signTokens(userId: number, roles: string[]) {
    const payload = { user: { id: userId, roles } };
    const accessToken = jwt.sign(payload, SETTINGS.JWT_SECRET_KEY, { expiresIn: SETTINGS.JWT_ACCESS_TOKEN_LIFETIME });
    const refreshToken = jwt.sign({ ...payload, type: 'refresh' }, SETTINGS.JWT_SECRET_KEY, { expiresIn: SETTINGS.JWT_REFRESH_TOKEN_LIFETIME });
    return { accessToken, refreshToken };
}

async function createUserProfile(user: AuthUser, first_name: string, last_name: string, phone?: string, role?: string): Promise<{ roles: string[] }> {
    try {
        const body: any = { id: user.id, first_name, last_name };
        if (phone) body.phone = phone;
        if (role) body.role = role;

        const res = await fetch(`${SETTINGS.USER_SERVICE_URL}/internal/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Service-Token': SETTINGS.SERVICE_TOKEN },
            body: JSON.stringify(body),
        });
        const data = await res.json() as any;
        return { roles: data.roles || (role ? [role] : []) };
    } catch {
        return { roles: role ? [role] : [] };
    }
}

async function fetchUserRoles(userId: number): Promise<string[]> {
    try {
        const res = await fetch(`${SETTINGS.USER_SERVICE_URL}/internal/users/${userId}`, {
            headers: { 'X-Service-Token': SETTINGS.SERVICE_TOKEN },
        });
        if (!res.ok) return [];
        const data = await res.json() as any;
        return data.roles || [];
    } catch {
        return [];
    }
}

@JsonController('/auth')
class AuthController {
    @Post('/register')
    @HttpCode(201)
    @OpenAPI({ summary: 'Регистрация нового пользователя' })
    async register(@Body({ type: RegisterDto }) dto: RegisterDto, @Res() res: Response) {
        const repo = dataSource.getRepository(AuthUser);
        const existing = await repo.findOneBy({ email: dto.email });
        if (existing) {
            return res.status(409).json({ code: 'EMAIL_ALREADY_EXISTS', message: 'Email уже зарегистрирован' });
        }

        const user = repo.create({ email: dto.email, passwordHash: hashPassword(dto.password) });
        await repo.save(user);

        const { roles } = await createUserProfile(user, dto.first_name, dto.last_name, dto.phone, dto.role);
        const tokens = signTokens(user.id, roles);

        return res.status(201).json({
            access_token: tokens.accessToken,
            refresh_token: tokens.refreshToken,
            user: { id: user.id, email: user.email, roles },
        });
    }

    @Post('/login')
    @OpenAPI({ summary: 'Вход в систему' })
    async login(@Body({ type: LoginDto }) dto: LoginDto, @Res() res: Response) {
        const repo = dataSource.getRepository(AuthUser);
        const user = await repo.findOneBy({ email: dto.email });
        if (!user || !checkPassword(user.passwordHash, dto.password)) {
            return res.status(401).json({ code: 'INVALID_CREDENTIALS', message: 'Неверные учётные данные' });
        }

        const roles = await fetchUserRoles(user.id);
        const tokens = signTokens(user.id, roles);

        return res.json({
            access_token: tokens.accessToken,
            refresh_token: tokens.refreshToken,
            user: { id: user.id, email: user.email, roles },
        });
    }

    @Post('/refresh')
    @OpenAPI({ summary: 'Обновление токена' })
    async refresh(@Body({ type: RefreshDto }) dto: RefreshDto, @Res() res: Response) {
        try {
            const payload: any = jwt.verify(dto.refresh_token, SETTINGS.JWT_SECRET_KEY);
            if (payload.type !== 'refresh') {
                return res.status(401).json({ code: 'INVALID_REFRESH_TOKEN', message: 'Невалидный refresh token' });
            }
            const user = await dataSource.getRepository(AuthUser).findOneBy({ id: payload.user.id });
            if (!user) return res.status(401).json({ code: 'INVALID_REFRESH_TOKEN', message: 'Пользователь не найден' });

            const roles = await fetchUserRoles(user.id);
            const tokens = signTokens(user.id, roles);
            return res.json({ access_token: tokens.accessToken, refresh_token: tokens.refreshToken, user: { id: user.id, email: user.email, roles } });
        } catch {
            return res.status(401).json({ code: 'INVALID_REFRESH_TOKEN', message: 'Невалидный refresh token' });
        }
    }

    @Post('/logout')
    @OpenAPI({ summary: 'Выход из системы' })
    async logout(@Res() res: Response) {
        return res.status(200).json({ message: 'Выход выполнен' });
    }

    @Post('/internal/validate')
    @UseBefore(serviceAuthMiddleware)
    @OpenAPI({ summary: 'Валидация JWT (internal)' })
    async validate(@Body({ type: ValidateDto }) dto: ValidateDto, @Res() res: Response) {
        try {
            const payload: any = jwt.verify(dto.token, SETTINGS.JWT_SECRET_KEY);
            return res.json({ user_id: payload.user.id, roles: payload.user.roles || [], is_active: true });
        } catch {
            return res.status(401).json({ code: 'UNAUTHORIZED', message: 'Token is invalid or expired' });
        }
    }
}

export default AuthController;
