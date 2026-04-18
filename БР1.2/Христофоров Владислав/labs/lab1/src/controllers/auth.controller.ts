import {
    JsonController,
    Post,
    Body,
    HttpError,
    HttpCode,
} from 'routing-controllers';
import dataSource from '../config/data-source';
import { User } from '../models/user.entity';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import checkPassword from '../utils/check-password';
import jwt from 'jsonwebtoken';
import SETTINGS from '../config/settings';

@JsonController('/auth')
export default class AuthController {
    private userRepository = dataSource.getRepository(User);

    @Post('/register')
    @HttpCode(201)
    async register(@Body() body: RegisterDto) {
        const existingUser = await this.userRepository.findOne({
            where: [{ email: body.email }, { username: body.username }],
        });

        if (existingUser) {
            throw new HttpError(
                400,
                'Пользователь с таким email или username уже существует',
            );
        }

        const user = this.userRepository.create({
            username: body.username,
            email: body.email,
            password_hash: body.password,
        });

        await this.userRepository.save(user);

        const { password_hash, ...userData } = user;
        return userData;
    }

    @Post('/login')
    async login(@Body() body: LoginDto) {
        const user = await this.userRepository.findOneBy({ email: body.email });

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

        const accessToken = jwt.sign(
            { user: { id: user.id, role: user.role } },
            SETTINGS.JWT_SECRET_KEY,
            { expiresIn: SETTINGS.JWT_ACCESS_TOKEN_LIFETIME },
        );

        return { access_token: accessToken };
    }
}
