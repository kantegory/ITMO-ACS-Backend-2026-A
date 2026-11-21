import { Body, HttpCode, JsonController, Post, UseBefore } from 'routing-controllers';
import {
    IsEmail,
    IsNotEmpty,
    IsString,
    Matches,
    MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { OpenAPI } from 'routing-controllers-openapi';
import dataSource from '../config/data-source';
import { ApiError } from '../common/api-error';
import { serializeAuthUser } from '../common/serializers';
import { PHONE_REGEX } from '../common/validation';
import authMiddleware from '../middlewares/auth.middleware';
import { User } from '../models/user.entity';
import checkPassword from '../utils/check-password';
import { buildAuthTokens } from '../utils/tokens';

class RegisterDto {
    @IsString()
    @IsNotEmpty()
    @Type(() => String)
    firstName: string;

    @IsString()
    @IsNotEmpty()
    @Type(() => String)
    lastName: string;

    @IsEmail()
    @Type(() => String)
    email: string;

    @IsString()
    @Matches(PHONE_REGEX)
    @Type(() => String)
    phone: string;

    @IsString()
    @MinLength(8)
    @Type(() => String)
    password: string;

    @IsString()
    @Type(() => String)
    passwordConfirmation: string;
}

class LoginDto {
    @IsEmail()
    @Type(() => String)
    email: string;

    @IsString()
    @Type(() => String)
    password: string;
}

@JsonController('/auth')
class AuthController {
    private userRepository = dataSource.getRepository(User);

    @Post('/login')
    async login(@Body() loginData: LoginDto) {
        const { email, password } = loginData;
        const user = await this.userRepository.findOneBy({ email });

        if (!user || !checkPassword(user.password, password)) {
            throw new ApiError(
                401,
                'INVALID_CREDENTIALS',
                'Email or password is incorrect',
            );
        }

        return {
            data: {
                user: serializeAuthUser(user),
                tokens: buildAuthTokens(user),
            },
        };
    }

    @Post('/register')
    @HttpCode(201)
    async register(@Body() body: RegisterDto) {
        if (body.password !== body.passwordConfirmation) {
            throw new ApiError(
                422,
                'VALIDATION_ERROR',
                'Password confirmation does not match password',
            );
        }

        const emailExists = await this.userRepository.existsBy({ email: body.email });
        if (emailExists) {
            throw new ApiError(409, 'EMAIL_EXISTS', 'User with this email already exists');
        }

        const phoneExists = await this.userRepository.existsBy({ phone: body.phone });
        if (phoneExists) {
            throw new ApiError(409, 'PHONE_EXISTS', 'User with this phone already exists');
        }

        const user = this.userRepository.create({
            firstName: body.firstName,
            lastName: body.lastName,
            email: body.email,
            phone: body.phone,
            password: body.password,
        });

        const createdUser = await this.userRepository.save(user);

        return {
            data: {
                user: serializeAuthUser(createdUser),
                tokens: buildAuthTokens(createdUser),
            },
        };
    }

    @Post('/logout')
    @UseBefore(authMiddleware)
    @OpenAPI({
        security: [{ bearerAuth: [] }],
    })
    async logout() {
        return {
            message: 'Logged out successfully',
        };
    }
}

export default AuthController;
