import { Body, Post, HttpCode } from 'routing-controllers';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';
import jwt from 'jsonwebtoken';

import SETTINGS from '../config/settings';
import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';
import { User } from '../models/user.entity';
import { Role } from '../models/role.entity';
import { RoleName } from '../common/enums';
import checkPassword from '../utils/check-password';
import hashPassword from '../utils/hash-password';
import dataSource from '../config/data-source';
import { RegisterDto, LoginDto, LoginResponseDto, ErrorResponseDto } from '../dto/auth.dto';

@EntityController({
    baseRoute: '/auth',
    entity: User,
})
class AuthController extends BaseController {
    @Post('/register')
    @HttpCode(201)
    @OpenAPI({ summary: 'Register a new user' })
    @ResponseSchema(LoginResponseDto, { statusCode: 201 })
    @ResponseSchema(ErrorResponseDto, { statusCode: 400 })
    async register(
        @Body({ type: RegisterDto }) registerData: RegisterDto,
    ): Promise<LoginResponseDto | ErrorResponseDto> {
        const { email, password, first_name, middle_name, last_name, phone } = registerData;

        const existing = await this.repository.findOneBy({ email });
        if (existing) {
            return { message: 'User with this email already exists' };
        }

        const roleRepo = dataSource.getRepository(Role);
        let userRole = await roleRepo.findOneBy({ name: RoleName.User });
        if (!userRole) {
            userRole = roleRepo.create({ name: RoleName.User });
            await roleRepo.save(userRole);
        }

        const newUser = this.repository.create({
            email,
            password_hash: hashPassword(password),
            first_name: first_name || null,
            middle_name: middle_name || null,
            last_name: last_name || null,
            phone: phone || null,
            role_id: userRole.role_id,
        });

        const savedUser = await this.repository.save(newUser) as User;

        const accessToken = jwt.sign(
            { user: { id: savedUser.user_id, role: RoleName.User } },
            SETTINGS.JWT_SECRET_KEY,
            { expiresIn: SETTINGS.JWT_ACCESS_TOKEN_LIFETIME },
        );

        return { accessToken };
    }

    @Post('/login')
    @OpenAPI({ summary: 'Login' })
    @ResponseSchema(LoginResponseDto, { statusCode: 200 })
    @ResponseSchema(ErrorResponseDto, { statusCode: 400 })
    async login(
        @Body({ type: LoginDto }) loginData: LoginDto,
    ): Promise<LoginResponseDto | ErrorResponseDto> {
        const { email, password } = loginData;

        const user = await this.repository.findOne({
            where: { email },
            relations: ['role'],
        }) as User;

        if (!user) {
            return { message: 'User is not found' };
        }

        const isPasswordCorrect = checkPassword(user.password_hash, password);

        if (!isPasswordCorrect) {
            return { message: 'Password or email is incorrect' };
        }

        const accessToken = jwt.sign(
            { user: { id: user.user_id, role: user.role?.name } },
            SETTINGS.JWT_SECRET_KEY,
            { expiresIn: SETTINGS.JWT_ACCESS_TOKEN_LIFETIME },
        );

        return { accessToken };
    }
}

export default AuthController;
