import { Body, HttpCode, HttpError, JsonController, Post, UnauthorizedError } from 'routing-controllers';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';

import SETTINGS from '../config/settings';
import dataSource from '../config/data-source';
import { AuthResponseDto, ErrorResponseDto, LoginRequestDto, RegisterRequestDto } from '../dto/api.dto';
import { toUserProfileDto } from '../mappers/api.mapper';
import { User } from '../models';
import checkPassword from '../utils/check-password';
import hashPassword from '../utils/hash-password';
import { createAccessToken } from '../utils/jwt';

const toAuthResponse = (user: User): AuthResponseDto => {
    return {
        accessToken: createAccessToken(user.id),
        tokenType: SETTINGS.JWT_TOKEN_TYPE,
        expiresIn: SETTINGS.JWT_ACCESS_TOKEN_LIFETIME,
        user: toUserProfileDto(user),
    };
};

@JsonController('/auth')
export default class AuthController {
    private userRepository = dataSource.getRepository(User);

    @Post('/register')
    @HttpCode(201)
    @OpenAPI({
        summary: 'Регистрация пользователя',
        tags: ['Auth'],
    })
    @ResponseSchema(AuthResponseDto, { statusCode: 201 })
    @ResponseSchema(ErrorResponseDto, { statusCode: 400 })
    @ResponseSchema(ErrorResponseDto, { statusCode: 409 })
    async register(
        @Body({ validate: true, type: RegisterRequestDto })
        registerData: RegisterRequestDto,
    ): Promise<AuthResponseDto> {
        const existingUser = await this.userRepository
            .createQueryBuilder('user')
            .where('user.username = :username', { username: registerData.username })
            .orWhere('user.email = :email', { email: registerData.email })
            .getOne();

        if (existingUser) {
            throw new HttpError(409, 'Username or email already in use');
        }

        const user = this.userRepository.create({
            username: registerData.username,
            email: registerData.email,
            passwordHash: hashPassword(registerData.password),
            bio: null,
            avatarUrl: null,
        });

        const savedUser = await this.userRepository.save(user);

        return toAuthResponse(savedUser);
    }

    @Post('/login')
    @OpenAPI({
        summary: 'Вход в систему',
        tags: ['Auth'],
    })
    @ResponseSchema(AuthResponseDto, { statusCode: 200 })
    @ResponseSchema(ErrorResponseDto, { statusCode: 400 })
    @ResponseSchema(ErrorResponseDto, { statusCode: 401 })
    async login(
        @Body({ validate: true, type: LoginRequestDto })
        loginData: LoginRequestDto,
    ): Promise<AuthResponseDto> {
        const user = await this.userRepository.findOne({
            where: {
                username: loginData.username,
            },
        });

        if (!user || !checkPassword(user.passwordHash, loginData.password)) {
            throw new UnauthorizedError('Username or password is incorrect');
        }

        return toAuthResponse(user);
    }
}
