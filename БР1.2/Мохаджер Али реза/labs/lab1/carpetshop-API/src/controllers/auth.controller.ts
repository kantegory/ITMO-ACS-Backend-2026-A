import { BadRequestError, Body, Post } from 'routing-controllers';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';
import { IsBoolean, IsEmail, IsInt, IsOptional, IsString, MinLength } from 'class-validator';
import { Type } from 'class-transformer';
import jwt from 'jsonwebtoken';

import SETTINGS from '../config/settings';

import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';

import { User } from '../models/user.entity';

import checkPassword from '../utils/check-password';

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
    @MinLength(8)
    @Type(() => String)
    password: string;

    @IsOptional()
    @IsString()
    @Type(() => String)
    phone?: string;
}

class LoginDto {
    @IsEmail()
    @Type(() => String)
    email: string;

    @IsString()
    @Type(() => String)
    password: string;
}

class UserReadDto {
    @IsInt()
    @Type(() => Number)
    id: number;

    @IsString()
    @Type(() => String)
    role: 'ADMIN' | 'SELLER' | 'CUSTOMER';

    @IsString()
    @Type(() => String)
    first_name: string;

    @IsString()
    @Type(() => String)
    last_name: string;

    @IsString()
    @Type(() => String)
    email: string;

    @IsOptional()
    @IsString()
    @Type(() => String)
    phone: string | null;

    @IsBoolean()
    is_verified: boolean;
}

class AuthResponseDto {
    @IsString()
    @Type(() => String)
    token: string;

    user: UserReadDto;
}

@EntityController({
    baseRoute: '/auth',
    entity: User,
})
class AuthController extends BaseController {
    @Post('/register')
    @OpenAPI({ summary: 'Регистрация пользователя' })
    @ResponseSchema(AuthResponseDto, { statusCode: 201 })
    async register(@Body({ type: RegisterDto }) dto: RegisterDto): Promise<AuthResponseDto> {
        const exists = await this.repository.findOneBy({ email: dto.email });
        if (exists) {
            throw new BadRequestError('Email already in use');
        }

        const user = this.repository.create({
            first_name: dto.first_name,
            last_name: dto.last_name,
            email: dto.email,
            password: dto.password,
            phone: dto.phone ?? null,
            role: 'CUSTOMER',
            is_verified: false,
        });

        const saved = await this.repository.save(user);

        const token = jwt.sign(
            { user: { id: saved.id, role: saved.role } },
            SETTINGS.JWT_SECRET_KEY,
            { expiresIn: SETTINGS.JWT_ACCESS_TOKEN_LIFETIME },
        );

        return {
            token,
            user: {
                id: saved.id,
                role: saved.role,
                first_name: saved.first_name,
                last_name: saved.last_name,
                email: saved.email,
                phone: saved.phone,
                is_verified: saved.is_verified,
            },
        };
    }

    @Post('/login')
    @OpenAPI({ summary: 'Авторизация пользователя' })
    @ResponseSchema(AuthResponseDto, { statusCode: 200 })
    async login(
        @Body({ type: LoginDto }) loginData: LoginDto,
    ): Promise<AuthResponseDto> {
        const { email, password } = loginData;
        const user = await this.repository.findOneBy({ email });

        if (!user) {
            throw new BadRequestError('Invalid email or password');
        }

        const userPassword = user.password;
        const isPasswordCorrect = checkPassword(userPassword, password);

        if (!isPasswordCorrect) {
            throw new BadRequestError('Invalid email or password');
        }

        const token = jwt.sign(
            { user: { id: user.id, role: user.role } },
            SETTINGS.JWT_SECRET_KEY,
            {
                expiresIn: SETTINGS.JWT_ACCESS_TOKEN_LIFETIME,
            },
        );

        return {
            token,
            user: {
                id: user.id,
                role: user.role,
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email,
                phone: user.phone,
                is_verified: user.is_verified,
            },
        };
    }
}

export default AuthController;
