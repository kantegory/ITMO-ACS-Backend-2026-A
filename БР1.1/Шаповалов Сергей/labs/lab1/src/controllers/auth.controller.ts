import {
    Body,
    Post,
    HttpCode,
    BadRequestError,
} from 'routing-controllers';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';
import { IsString, IsEmail, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import jwt from 'jsonwebtoken';

import SETTINGS from '../config/settings';
import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';
import { User } from '../models/user.entity';
import { Role, RoleName } from '../models/role.entity';
import checkPassword from '../utils/check-password';
import dataSource from '../config/data-source';
import { serializeUser } from '../utils/serializers';

class LoginDto {
    @IsEmail()
    @Type(() => String)
    email: string;

    @IsString()
    @Type(() => String)
    password: string;
}

class RegisterDto {
    @IsString()
    @Type(() => String)
    first_name: string;

    @IsString()
    @Type(() => String)
    last_name: string;

    @IsOptional()
    @IsString()
    @Type(() => String)
    middle_name?: string;

    @IsEmail()
    @Type(() => String)
    email: string;

    @IsString()
    @Type(() => String)
    password: string;

    @IsOptional()
    @IsString()
    @Type(() => String)
    role?: string;
}

class LoginResponseDto {
    @IsString()
    accessToken: string;
}

class ErrorResponseDto {
    @IsString()
    message: string;
}

@EntityController({
    baseRoute: '/auth',
    entity: User,
})
class AuthController extends BaseController {
    @Post('/login')
    @HttpCode(200)
    @OpenAPI({ summary: 'Вход', tags: ['Аутентификация'] })
    @ResponseSchema(LoginResponseDto, { statusCode: 200 })
    @ResponseSchema(ErrorResponseDto, { statusCode: 400 })
    async login(
        @Body({ type: LoginDto }) loginData: LoginDto,
    ): Promise<LoginResponseDto | ErrorResponseDto> {
        const { email, password } = loginData;
        const user = await this.repository.findOne({
            where: { email },
            select: ['id', 'email', 'password'],
        });

        if (!user) {
            throw new BadRequestError('User is not found');
        }

        const isPasswordCorrect = checkPassword(user.password, password);

        if (!isPasswordCorrect) {
            throw new BadRequestError('Password or email is incorrect');
        }

        const accessToken = jwt.sign(
            { user: { id: user.id } },
            SETTINGS.JWT_SECRET_KEY,
            { expiresIn: SETTINGS.JWT_ACCESS_TOKEN_LIFETIME },
        );

        return { accessToken };
    }

    @Post('/register')
    @HttpCode(201)
    @OpenAPI({ summary: 'Регистрация', tags: ['Аутентификация'] })
    async register(@Body({ type: RegisterDto }) data: RegisterDto) {
        const existingUser = await this.repository.findOneBy({ email: data.email });
        if (existingUser) {
            throw new BadRequestError('User with this email already exists');
        }

        const roleRepository = dataSource.getRepository(Role);
        const roleName = (data.role as RoleName) || RoleName.USER;
        let role = await roleRepository.findOneBy({ name: roleName });
        if (!role) {
            role = await roleRepository.findOneBy({ name: RoleName.USER });
        }

        const user = this.repository.create({
            firstName: data.first_name,
            lastName: data.last_name,
            middleName: data.middle_name,
            email: data.email,
            password: data.password,
            roleId: role?.id,
        });

        const saved = await this.repository.save(user);
        const fullUser = await this.repository.findOne({
            where: { id: saved.id },
            relations: ['role'],
        });

        return serializeUser(fullUser);
    }
}

export default AuthController;
