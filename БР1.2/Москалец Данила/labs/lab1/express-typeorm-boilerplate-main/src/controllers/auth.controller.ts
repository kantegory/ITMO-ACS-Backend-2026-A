import {
    BadRequestError,
    Body,
    ForbiddenError,
    Get,
    JsonController,
    Post,
    Req,
    UnauthorizedError,
    UseBefore,
} from 'routing-controllers';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';
import jwt from 'jsonwebtoken';

import dataSource from '../config/data-source';
import SETTINGS from '../config/settings';
import ConflictError from '../common/conflict-error';
import { UserRole } from '../enums/role.enum';
import { AuthMiddleware, RequestWithUser } from '../middlewares/auth.middleware';
import { RefreshToken } from '../models/refresh-token.entity';
import { User } from '../models/user.entity';
import checkPassword from '../utils/check-password';
import { signAccessToken, signRefreshToken } from '../utils/auth-tokens';
import { serializeUser } from '../utils/serializers';
import { successResponse } from '../utils/response';

class RegisterDto {
    @IsEmail()
    email: string;

    @IsString()
    @MinLength(6)
    password: string;

    @IsString()
    first_name: string;

    @IsString()
    last_name: string;

    @IsOptional()
    @IsString()
    middle_name?: string;
}

class LoginDto {
    @IsEmail()
    email: string;

    @IsString()
    password: string;
}

class RefreshDto {
    @IsString()
    refresh_token: string;
}

@JsonController('/auth')
class AuthController {
    private userRepository = dataSource.getRepository(User);

    private refreshTokenRepository = dataSource.getRepository(RefreshToken);

    private async createAuthResponse(user: User) {
        const accessToken = signAccessToken(user);
        const refreshToken = signRefreshToken(user);
        const expiresAt = new Date(
            Date.now() + SETTINGS.JWT_REFRESH_TOKEN_LIFETIME * 1000,
        );

        await this.refreshTokenRepository.save(
            this.refreshTokenRepository.create({
                token: refreshToken,
                expiresAt,
                user,
            }),
        );

        return successResponse({
            access_token: accessToken,
            refresh_token: refreshToken,
            expires_in: SETTINGS.JWT_ACCESS_TOKEN_LIFETIME,
        });
    }

    @Post('/register')
    async register(@Body({ validate: true, type: RegisterDto }) body: RegisterDto) {
        const existingUser = await this.userRepository.findOneBy({
            email: body.email,
        });

        if (existingUser) {
            throw new ConflictError('Email already exists');
        }

        const user = this.userRepository.create({
            email: body.email,
            password: body.password,
            firstName: body.first_name,
            lastName: body.last_name,
            middleName: body.middle_name,
            role: UserRole.USER,
        });

        const createdUser = await this.userRepository.save(user);

        return successResponse(serializeUser(createdUser));
    }

    @Post('/login')
    async login(@Body({ validate: true, type: LoginDto }) body: LoginDto) {
        const user = await this.userRepository
            .createQueryBuilder('user')
            .addSelect('user.password')
            .where('user.email = :email', { email: body.email })
            .getOne();

        if (!user || !checkPassword(user.password, body.password)) {
            throw new UnauthorizedError('Invalid email or password');
        }

        return this.createAuthResponse(user);
    }

    @Post('/logout')
    @UseBefore(AuthMiddleware)
    async logout(@Body({ validate: true, type: RefreshDto }) body: RefreshDto) {
        if (!body.refresh_token) {
            throw new BadRequestError('Refresh token is required');
        }

        const token = await this.refreshTokenRepository.findOneBy({
            token: body.refresh_token,
        });

        if (!token) {
            throw new UnauthorizedError('Invalid refresh token');
        }

        await this.refreshTokenRepository.remove(token);

        return successResponse({
            message: 'Successfully logged out',
        });
    }

    @Get('/me')
    @UseBefore(AuthMiddleware)
    async me(@Req() req: RequestWithUser) {
        const user = await this.userRepository.findOneBy({ id: req.user.id });

        if (!user) {
            throw new UnauthorizedError('User not found');
        }

        return successResponse(serializeUser(user));
    }

    @Post('/refresh')
    async refresh(@Body({ validate: true, type: RefreshDto }) body: RefreshDto) {
        const storedToken = await this.refreshTokenRepository.findOne({
            where: { token: body.refresh_token },
            relations: {
                user: true,
            },
        });

        if (!storedToken || storedToken.expiresAt < new Date()) {
            throw new UnauthorizedError('Invalid refresh token');
        }

        try {
            jwt.verify(body.refresh_token, SETTINGS.JWT_REFRESH_SECRET_KEY);
        } catch (error) {
            throw new UnauthorizedError('Invalid refresh token');
        }

        await this.refreshTokenRepository.remove(storedToken);

        return this.createAuthResponse(storedToken.user);
    }
}

export default AuthController;
