import {
    Body,
    Post,
    HttpCode,
    BadRequestError,
    UnauthorizedError,
} from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';
import jwt from 'jsonwebtoken';

import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';
import SETTINGS from '../config/settings';

import { User } from '../models/user.entity';
import { UserRole } from '../models/enums';

import { RegisterDto, LoginDto, RefreshDto } from '../dto/auth.dto';
import checkPassword from '../utils/check-password';
import { issueTokens } from '../utils/tokens';

function publicUser(user: User) {
    const { password, ...rest } = user;
    return rest;
}

@EntityController({ baseRoute: '/auth', entity: User })
class AuthController extends BaseController {
    @Post('/register')
    @HttpCode(201)
    @OpenAPI({ summary: 'Регистрация нового пользователя' })
    async register(@Body() data: RegisterDto) {
        const existing = await this.repository.findOneBy({ email: data.email });
        if (existing) {
            throw new BadRequestError('Пользователь с таким email уже существует');
        }

        const user = this.repository.create({
            email: data.email,
            password: data.password,
            firstName: data.firstName,
            lastName: data.lastName,
            phone: data.phone ?? null,
            role: data.role ?? UserRole.TENANT,
        });
        const saved = (await this.repository.save(user)) as unknown as User;

        return { ...issueTokens(saved), user: publicUser(saved) };
    }

    @Post('/login')
    @OpenAPI({ summary: 'Аутентификация по email и паролю' })
    async login(@Body() data: LoginDto) {
        const user = (await this.repository.findOneBy({
            email: data.email,
        })) as unknown as User;

        if (!user || !checkPassword(user.password, data.password)) {
            throw new UnauthorizedError('Неверный email или пароль');
        }

        return { ...issueTokens(user), user: publicUser(user) };
    }

    @Post('/refresh')
    @OpenAPI({ summary: 'Обновление пары токенов' })
    async refresh(@Body() data: RefreshDto) {
        try {
            const payload: any = jwt.verify(
                data.refreshToken,
                SETTINGS.JWT_SECRET_KEY,
            );
            const user = (await this.repository.findOneBy({
                id: payload.user.id,
            })) as unknown as User;
            if (!user) throw new Error('not found');

            return { ...issueTokens(user), user: publicUser(user) };
        } catch {
            throw new UnauthorizedError('Refresh-токен недействителен');
        }
    }
}

export default AuthController;
