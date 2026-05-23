import { Body, HttpCode, Post, Res } from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';
import { IsString, IsEmail, MinLength, IsOptional, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import jwt from 'jsonwebtoken';
import { Response } from 'express';

import SETTINGS from '../config/settings';
import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';

import { User } from '../models/user.entity';
import { UserRoleEntity } from '../models/user-role.entity';
import { UserRole } from '../models/enums';
import checkPassword from '../utils/check-password';
import hashPassword from '../utils/hash-password';
import dataSource from '../config/data-source';

class RegisterDto {
    @IsString()
    @Type(() => String)
    first_name: string;

    @IsString()
    @Type(() => String)
    last_name: string;

    @IsEmail()
    @Type(() => String)
    email: string;

    @IsString()
    @MinLength(6)
    @Type(() => String)
    password: string;

    @IsString()
    @IsOptional()
    @Type(() => String)
    phone?: string;

    @IsEnum(UserRole)
    @IsOptional()
    role?: UserRole;
}

class LoginDto {
    @IsEmail()
    @Type(() => String)
    email: string;

    @IsString()
    @Type(() => String)
    password: string;
}

class RefreshDto {
    @IsString()
    @Type(() => String)
    refresh_token: string;
}

function signTokens(userId: number) {
    const accessToken = jwt.sign(
        { user: { id: userId } },
        SETTINGS.JWT_SECRET_KEY,
        { expiresIn: SETTINGS.JWT_ACCESS_TOKEN_LIFETIME },
    );
    const refreshToken = jwt.sign(
        { user: { id: userId }, type: 'refresh' },
        SETTINGS.JWT_SECRET_KEY,
        { expiresIn: SETTINGS.JWT_REFRESH_TOKEN_LIFETIME },
    );
    return { accessToken, refreshToken };
}

function buildUserShort(user: User, roles: UserRoleEntity[]) {
    return {
        id: user.id,
        first_name: user.firstName,
        last_name: user.lastName,
        email: user.email,
        avatar_url: user.avatarUrl ?? null,
        roles: roles.map((r) => r.role),
    };
}

@EntityController({ baseRoute: '/auth', entity: User })
class AuthController extends BaseController {
    @Post('/register')
    @HttpCode(201)
    @OpenAPI({ summary: 'Регистрация нового пользователя' })
    async register(@Body({ type: RegisterDto }) dto: RegisterDto, @Res() res: Response) {
        const userRepo = dataSource.getRepository(User);
        const existing = await userRepo.findOneBy({ email: dto.email });
        if (existing) {
            return res.status(409).json({ code: 'EMAIL_ALREADY_EXISTS', message: 'Email уже зарегистрирован' });
        }

        const user = userRepo.create({
            firstName: dto.first_name,
            lastName: dto.last_name,
            email: dto.email,
            passwordHash: hashPassword(dto.password),
            phone: dto.phone ?? null,
        });
        await userRepo.save(user);

        if (dto.role) {
            const roleRepo = dataSource.getRepository(UserRoleEntity);
            const userRole = roleRepo.create({ userId: user.id, role: dto.role });
            await roleRepo.save(userRole);
        }

        const roles = await dataSource.getRepository(UserRoleEntity).findBy({ userId: user.id });
        const tokens = signTokens(user.id);

        return res.status(201).json({
            access_token: tokens.accessToken,
            refresh_token: tokens.refreshToken,
            user: buildUserShort(user, roles),
        });
    }

    @Post('/login')
    @OpenAPI({ summary: 'Вход в систему' })
    async login(@Body({ type: LoginDto }) dto: LoginDto, @Res() res: Response) {
        const userRepo = dataSource.getRepository(User);
        const user = await userRepo.findOneBy({ email: dto.email });

        if (!user) {
            return res.status(401).json({ code: 'INVALID_CREDENTIALS', message: 'Неверные учётные данные' });
        }

        const isPasswordCorrect = checkPassword(user.passwordHash, dto.password);
        if (!isPasswordCorrect) {
            return res.status(401).json({ code: 'INVALID_CREDENTIALS', message: 'Неверные учётные данные' });
        }

        const roles = await dataSource.getRepository(UserRoleEntity).findBy({ userId: user.id });
        const tokens = signTokens(user.id);

        return res.json({
            access_token: tokens.accessToken,
            refresh_token: tokens.refreshToken,
            user: buildUserShort(user, roles),
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

            const userRepo = dataSource.getRepository(User);
            const user = await userRepo.findOneBy({ id: payload.user.id });
            if (!user) {
                return res.status(401).json({ code: 'INVALID_REFRESH_TOKEN', message: 'Пользователь не найден' });
            }

            const roles = await dataSource.getRepository(UserRoleEntity).findBy({ userId: user.id });
            const tokens = signTokens(user.id);

            return res.json({
                access_token: tokens.accessToken,
                refresh_token: tokens.refreshToken,
                user: buildUserShort(user, roles),
            });
        } catch {
            return res.status(401).json({ code: 'INVALID_REFRESH_TOKEN', message: 'Невалидный refresh token' });
        }
    }

    @Post('/logout')
    @OpenAPI({ summary: 'Выход из системы' })
    async logout(@Res() res: Response) {
        return res.status(200).json({ message: 'Выход выполнен' });
    }
}

export default AuthController;
