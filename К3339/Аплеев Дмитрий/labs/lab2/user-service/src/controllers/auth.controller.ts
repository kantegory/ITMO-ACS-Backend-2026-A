import {
    Body,
    Post,
    HttpCode,
    HttpError,
    UnauthorizedError,
} from 'routing-controllers';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';
import { IsString, IsEmail, MinLength, Length } from 'class-validator';
import { Type } from 'class-transformer';
import jwt from 'jsonwebtoken';

import SETTINGS from '../config/settings';

import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';

import { User } from '../models/user.entity';

import checkPassword from '../utils/check-password';

class RegisterDto {
    @IsString()
    @Length(3, 50)
    @Type(() => String)
    username: string;

    @IsEmail()
    @Type(() => String)
    email: string;

    @IsString()
    @MinLength(6)
    @Type(() => String)
    password: string;
}

class LoginDto {
    @IsEmail()
    @Type(() => String)
    email: string;

    @IsString()
    @Type(() => String)
    password: string;
}

class LoginResponseDto {
    @IsString()
    @Type(() => String)
    accessToken: string;
}

class ErrorResponseDto {
    @IsString()
    @Type(() => String)
    message: string;
}

@EntityController({
    baseRoute: '/v1/auth',
    entity: User,
})
class AuthController extends BaseController {
    @Post('/register')
    @HttpCode(201)
    @OpenAPI({ summary: 'Регистрация' })
    @ResponseSchema(ErrorResponseDto, { statusCode: 409 })
    async register(@Body({ type: RegisterDto }) registerData: RegisterDto) {
        const { username, email, password } = registerData;

        const userWithEmail = await this.repository.findOneBy({ email });
        if (userWithEmail) {
            throw new HttpError(409, 'Email already in use');
        }

        const userWithUsername = await this.repository.findOneBy({ username });
        if (userWithUsername) {
            throw new HttpError(409, 'Username already in use');
        }

        // пароль хеширует user.subscriber.ts перед сохранением
        const user = this.repository.create({ username, email, password });
        const savedUser = await this.repository.save(user);

        // пароль (даже хеш) наружу не отдаём
        delete savedUser.password;
        return savedUser;
    }

    @Post('/login')
    @OpenAPI({ summary: 'Вход' })
    @ResponseSchema(LoginResponseDto, { statusCode: 200 })
    @ResponseSchema(ErrorResponseDto, { statusCode: 401 })
    async login(
        @Body({ type: LoginDto }) loginData: LoginDto,
    ): Promise<LoginResponseDto> {
        const { email, password } = loginData;
        const user = await this.repository.findOneBy({ email });

        if (!user) {
            throw new UnauthorizedError('Invalid email or password');
        }

        const isPasswordCorrect = checkPassword(user.password, password);

        if (!isPasswordCorrect) {
            throw new UnauthorizedError('Invalid email or password');
        }

        // role кладём в токен, чтобы потом проверять права админа
        const accessToken = jwt.sign(
            { user: { id: user.id, role: user.role } },
            SETTINGS.JWT_SECRET_KEY,
            {
                expiresIn: SETTINGS.JWT_ACCESS_TOKEN_LIFETIME,
            },
        );

        return { accessToken };
    }
}

export default AuthController;
