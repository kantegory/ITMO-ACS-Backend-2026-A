import { Body, Post, JsonController, HttpCode, HttpError } from 'routing-controllers';
import jwt from 'jsonwebtoken';
import dataSource from '../config/data-source';
import SETTINGS from '../config/settings';
import { User } from '../models/user.entity';
import checkPassword from '../utils/check-password';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';

@JsonController('/auth')
export class AuthController {
    private userRepository = dataSource.getRepository(User);

    @Post('/register')
    @HttpCode(201)
    async register(@Body() body: RegisterDto) {
        const existingUser = await this.userRepository.findOne({
            where: [{ email: body.email }, { username: body.username }],
            withDeleted: true,
        });

        if (existingUser) {
            throw new HttpError(
                400,
                'Пользователь с таким email или username уже существует (возможно, аккаунт был удален)',
            );
        }

        const user = this.userRepository.create({
            username: body.username,
            email: body.email,
            password_hash: body.password,
        });

        const savedUser = await this.userRepository.save(user);
        const { password_hash, ...userWithoutPassword } = savedUser;

        return userWithoutPassword;
    }

    @Post('/login')
    async login(@Body() body: LoginDto) {
        const user = await this.userRepository.findOne({
            where: { email: body.email },
            withDeleted: true,
        });

        if (!user) {
            throw new HttpError(401, 'Неверный email или пароль');
        }

        const isPasswordCorrect = checkPassword(
            user.password_hash,
            body.password,
        );

        if (!isPasswordCorrect) {
            throw new HttpError(401, 'Неверный email или пароль');
        }

        if (user.is_banned) {
            throw new HttpError(
                403,
                'Этот аккаунт заблокирован администратором за нарушения',
            );
        }

        let message = 'Успешный вход';
        if (user.deleted_at !== null) {
            await this.userRepository.restore(user.id);
            message = 'С возвращением! Ваш аккаунт был успешно восстановлен.';
        }

        const accessToken = jwt.sign(
            { id: user.id, role: user.role },
            SETTINGS.JWT_SECRET_KEY,
            { expiresIn: SETTINGS.JWT_ACCESS_TOKEN_LIFETIME },
        );

        return {
            message,
            accessToken,
        };
    }
}
