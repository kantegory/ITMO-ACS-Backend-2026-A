import { Body, Post, HttpCode, BadRequestError, UnauthorizedError } from 'routing-controllers';

import EntityController from '../../../shared/entity-controller';
import BaseController from '../../../shared/base-controller';
import { hashPassword, checkPassword } from '../../../shared/hash-password';
import { issueTokens } from '../../../shared/tokens';

import dataSource from '../data-source';
import { User, UserRole } from '../models/user.entity';
import { RegisterDto, LoginDto } from '../dto/auth.dto';

function publicUser(user: User) {
    const { password, ...rest } = user;
    return rest;
}

@EntityController({ baseRoute: '/auth', entity: User, dataSource })
class AuthController extends BaseController {
    @Post('/register')
    @HttpCode(201)
    async register(@Body() data: RegisterDto) {
        const existing = await this.repository.findOneBy({ email: data.email });
        if (existing) throw new BadRequestError('Пользователь с таким email уже существует');

        const user = this.repository.create({
            email: data.email,
            password: hashPassword(data.password),
            firstName: data.firstName,
            lastName: data.lastName,
            phone: data.phone ?? null,
            role: data.role ?? UserRole.TENANT,
        });
        const saved = (await this.repository.save(user)) as unknown as User;
        return { ...issueTokens(saved), user: publicUser(saved) };
    }

    @Post('/login')
    async login(@Body() data: LoginDto) {
        const user = (await this.repository.findOneBy({ email: data.email })) as unknown as User;
        if (!user || !checkPassword(user.password, data.password)) {
            throw new UnauthorizedError('Неверный email или пароль');
        }
        return { ...issueTokens(user), user: publicUser(user) };
    }
}

export default AuthController;
