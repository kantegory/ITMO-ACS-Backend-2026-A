import { JsonController, Body, Post, Req, Res } from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';
import { IsString, IsEmail, MinLength, Length } from 'class-validator';
import { Type } from 'class-transformer';
import { Request, Response } from 'express';

import SETTINGS from '../config/settings';
import { callService, sendResult } from '../utils/call-service';

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

// регистрация и вход целиком в user-service, BFF только проксирует запрос
@JsonController('/v1/auth')
class AuthController {
    @Post('/register')
    @OpenAPI({ summary: 'Регистрация' })
    async register(
        @Req() request: Request,
        @Res() response: Response,
        @Body({ type: RegisterDto }) registerData: RegisterDto,
    ) {
        const result = await callService(
            'POST',
            `${SETTINGS.USER_SERVICE_URL}/v1/auth/register`,
            request,
            registerData,
        );

        return sendResult(response, result);
    }

    @Post('/login')
    @OpenAPI({ summary: 'Вход' })
    async login(
        @Req() request: Request,
        @Res() response: Response,
        @Body({ type: LoginDto }) loginData: LoginDto,
    ) {
        const result = await callService(
            'POST',
            `${SETTINGS.USER_SERVICE_URL}/v1/auth/login`,
            request,
            loginData,
        );

        return sendResult(response, result);
    }
}

export default AuthController;
