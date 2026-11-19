import { Body, Post } from 'routing-controllers';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';
import { IsString, IsEmail, MinLength } from 'class-validator';
import { Type } from 'class-transformer';
import jwt from 'jsonwebtoken';

import SETTINGS from '../config/settings';

import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';

import { User } from '../models/user.entity';

import checkPassword from '../utils/check-password';
import hashPassword from '../utils/hash-password';

class RegisterDto {
    @IsString()
    @Type(() => String)
    username: string;

    @IsEmail()
    @Type(() => String)
    email: string;

    @IsString()
    @MinLength(6)
    @Type(() => String)
    password: string;

    @IsString()
    @Type(() => String)
    firstName: string;

    @IsString()
    @Type(() => String)
    lastName: string;
}

class LoginDto {
    @IsEmail()
    @Type(() => String)
    email: string;

    @IsString()
    @Type(() => String)
    password: string;
}

class AuthUserDto {
    id: number;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
}

class AuthResponseDto {
    @IsString()
    @Type(() => String)
    accessToken: string;

    user: AuthUserDto;
}

class ErrorResponseDto {
    @IsString()
    @Type(() => String)
    message: string;
}

@EntityController({
    baseRoute: '/auth',
    entity: User,
})
class AuthController extends BaseController {
    @Post('/register')
    @OpenAPI({ summary: 'Register new user' })
    @ResponseSchema(AuthResponseDto, { statusCode: 201 })
    @ResponseSchema(ErrorResponseDto, { statusCode: 400 })
    async register(
        @Body({ type: RegisterDto }) registerData: RegisterDto,
    ): Promise<AuthResponseDto | ErrorResponseDto> {
        const { username, email, password, firstName, lastName } = registerData;

        const existingUser = await this.repository.findOne({
            where: [{ email }, { username }],
        });

        if (existingUser) {
            return { message: 'User with this email or username already exists' };
        }

        const user = this.repository.create({
            username,
            email,
            password: hashPassword(password),
            firstName,
            lastName,
        });

        const savedUser = await this.repository.save(user);

        const accessToken = jwt.sign(
            { user: { id: savedUser.id } },
            SETTINGS.JWT_SECRET_KEY,
            {
                expiresIn: SETTINGS.JWT_ACCESS_TOKEN_LIFETIME,
            },
        );

        return {
            accessToken,
            user: {
                id: savedUser.id,
                username: savedUser.username,
                email: savedUser.email,
                firstName: savedUser.firstName,
                lastName: savedUser.lastName,
            },
        };
    }

    @Post('/login')
    @OpenAPI({ summary: 'Login' })
    @ResponseSchema(AuthResponseDto, { statusCode: 200 })
    @ResponseSchema(ErrorResponseDto, { statusCode: 400 })
    async login(
        @Body({ type: LoginDto }) loginData: LoginDto,
    ): Promise<AuthResponseDto | ErrorResponseDto> {
        const { email, password } = loginData;
        const user = await this.repository.findOneBy({ email });

        if (!user) {
            return { message: 'User is not found' };
        }

        const isPasswordCorrect = checkPassword(user.password, password);

        if (!isPasswordCorrect) {
            return { message: 'Password or email is incorrect' };
        }

        const accessToken = jwt.sign(
            { user: { id: user.id } },
            SETTINGS.JWT_SECRET_KEY,
            {
                expiresIn: SETTINGS.JWT_ACCESS_TOKEN_LIFETIME,
            },
        );

        return {
            accessToken,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
            },
        };
    }
}

export default AuthController;
