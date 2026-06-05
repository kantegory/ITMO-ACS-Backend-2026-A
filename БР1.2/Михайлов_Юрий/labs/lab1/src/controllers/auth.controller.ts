import {
    BadRequestError,
    Body,
    Post,
    UnauthorizedError,
} from 'routing-controllers';
import { IsEmail, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import jwt from 'jsonwebtoken';

import SETTINGS from '../config/settings';

import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';

import { User } from '../models/user.entity';

import checkPassword from '../utils/check-password';
import hashPassword from '../utils/hash-password';

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
    token: string;
}

class RegisterDto {
    @IsString()
    @Type(() => String)
    name: string;

    @IsEmail()
    @Type(() => String)
    email: string;

    @IsString()
    @Type(() => String)
    password: string;

    @IsString()
    @Type(() => String)
    phone: string;

    @IsString()
    @Type(() => String)
    another_contact: string;
}

@EntityController({
    baseRoute: '/auth',
    entity: User,
})
class AuthController extends BaseController {
    @Post('/register')
    async register(
        @Body({ type: RegisterDto }) body: RegisterDto,
    ): Promise<{ id: number; email: string }> {
        const existing = await this.repository.findOneBy({ email: body.email });
        if (existing) {
            throw new BadRequestError('User with this email already exists');
        }

        const created = this.repository.create({
            ...body,
            password: hashPassword(body.password),
        });
        const saved = await this.repository.save(created);

        return { id: saved.id, email: saved.email };
    }

    @Post('/login')
    async login(
        @Body({ type: LoginDto }) loginData: LoginDto,
    ): Promise<LoginResponseDto> {
        const { email, password } = loginData;
        // password has select:false, so explicitly include it
        const user = await this.repository
            .createQueryBuilder('user')
            .addSelect('user.password')
            .where('user.email = :email', { email })
            .getOne();

        if (!user) {
            throw new UnauthorizedError('Invalid email or password');
        }

        const userPassword = user.password;
        const isPasswordCorrect = checkPassword(userPassword, password);

        if (!isPasswordCorrect) {
            throw new UnauthorizedError('Invalid email or password');
        }

        const token = jwt.sign(
            { user: { id: user.id } },
            SETTINGS.JWT_SECRET_KEY,
            {
                expiresIn: SETTINGS.JWT_ACCESS_TOKEN_LIFETIME,
            },
        );

        return { token };
    }
}

export default AuthController;
