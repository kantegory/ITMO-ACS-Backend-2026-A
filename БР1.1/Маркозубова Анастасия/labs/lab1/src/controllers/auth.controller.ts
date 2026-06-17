import {
    Body,
    Post,
    HttpError,
    UnauthorizedError,
} from 'routing-controllers';
import { PublicOpenAPI } from '../common/auth-openapi';
import {
    IsString,
    IsEmail,
    IsIn,
    MinLength,
    IsInt,
    ValidateNested,
    IsDefined,
} from 'class-validator';
import { Type } from 'class-transformer';
import jwt from 'jsonwebtoken';

import SETTINGS from '../config/settings';

import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';

import { User } from '../models/user.entity';

import checkPassword from '../utils/check-password';

class RegisterCheck {
    @IsEmail()
    @Type(() => String)
    email: string;

    @IsString()
    @MinLength(6)
    @Type(() => String)
    password: string;

    @IsString()
    @IsIn(['seeker', 'company'])
    @Type(() => String)
    role: string;
}

class LoginCheck {
    @IsEmail()
    @Type(() => String)
    email: string;

    @IsString()
    @Type(() => String)
    password: string;
}

class UserShortCheck {
    @IsEmail()
    @Type(() => String)
    email: string;

    @IsInt()
    @Type(() => Number)
    user_id: number;

    @IsString()
    @Type(() => String)
    role: string;
}

class AuthResponseCheck {
    @IsString()
    @Type(() => String)
    accessToken: string;

    @IsString()
    @Type(() => String)
    tokenType: string;

    @IsDefined()
    @ValidateNested()
    @Type(() => UserShortCheck)
    user: UserShortCheck;
}

class ErrorResponseCheck {
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
    @PublicOpenAPI('Регистрация', ['auth'])
    async register(@Body({ type: RegisterCheck }) data: RegisterCheck): Promise<AuthResponseCheck> {
        const userFromDb = await this.repository.findOneBy({ email: data.email });

        if (userFromDb) {
            throw new HttpError(409, 'User with this email already exists');
        }

        const user = this.repository.create({
            email: data.email,
            password_hash: data.password,
            user_role: data.role,
        }) as User;

        const savedUser = await this.repository.save(user) as User;

        const token = jwt.sign(
            {
                user: {
                    user_id: savedUser.user_id,
                    role: savedUser.user_role,
                },
            },
            SETTINGS.JWT_SECRET_KEY,
            {
                expiresIn: SETTINGS.JWT_ACCESS_TOKEN_LIFETIME,
            },
        );

        return {
            accessToken: token,
            tokenType: 'Bearer',
            user: {
                user_id: savedUser.user_id,
                email: savedUser.email,
                role: savedUser.user_role,
            },
        };
    }

    @Post('/login')
    @PublicOpenAPI('Вход', ['auth'])
    async login(@Body({ type: LoginCheck }) data: LoginCheck): Promise<AuthResponseCheck> {
        const user = await this.repository.findOneBy({ email: data.email }) as User | null;

        if (!user) {
            throw new UnauthorizedError('Password or email is incorrect');
        }

        const correctPassword = checkPassword(user.password_hash, data.password);

        if (!correctPassword) {
            throw new UnauthorizedError('Password or email is incorrect');
        }

        const token = jwt.sign(
            {
                user: {
                    user_id: user.user_id,
                    role: user.user_role,
                },
            },
            SETTINGS.JWT_SECRET_KEY,
            {
                expiresIn: SETTINGS.JWT_ACCESS_TOKEN_LIFETIME,
            },
        );

        return {
            accessToken: token,
            tokenType: 'Bearer',
            user: {
                user_id: user.user_id,
                email: user.email,
                role: user.user_role,
            },
        };
    }
}
export default AuthController;
