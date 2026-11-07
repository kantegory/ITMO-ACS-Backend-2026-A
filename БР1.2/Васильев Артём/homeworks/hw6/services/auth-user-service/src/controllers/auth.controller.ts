import { Body, HttpCode, Post, UnauthorizedError } from 'routing-controllers';
import jwt from 'jsonwebtoken';

import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';
import SETTINGS from '../config/settings';
import { ensureConflict } from '../common/http-errors';
import { serializeUser } from '../common/serializers';
import { RegisterDto, LoginDto } from '../dto/auth.dto';
import { User } from '../models/user.entity';

import checkPassword from '../utils/check-password';

const buildAuthResponse = (user: User) => {
    const accessToken = jwt.sign(
        { user: { id: user.id, role: user.role } },
        SETTINGS.JWT_SECRET_KEY,
        { expiresIn: SETTINGS.JWT_ACCESS_TOKEN_LIFETIME },
    );

    return {
        access_token: accessToken,
        token_type: SETTINGS.JWT_TOKEN_TYPE,
        user: serializeUser(user),
    };
};

@EntityController({
    baseRoute: '/auth',
    entity: User,
})
class AuthController extends BaseController {
    @Post('/register')
    @HttpCode(201)
    async register(@Body({ type: RegisterDto }) payload: RegisterDto) {
        const existingUser = await this.repository.findOneBy({
            email: payload.email,
        });

        ensureConflict(!existingUser, 'Email is already in use');

        const user = this.repository.create({
            role: payload.role,
            firstName: payload.first_name,
            lastName: payload.last_name,
            middleName: payload.middle_name ?? null,
            email: payload.email,
            password: payload.password,
            phone: payload.phone,
            isVerified: false,
        });

        const createdUser = (await this.repository.save(user)) as User;

        return serializeUser(createdUser);
    }

    @Post('/login')
    async login(@Body({ type: LoginDto }) payload: LoginDto) {
        const user = (await this.repository.findOneBy({
            email: payload.email,
        })) as User | null;

        if (!user || !checkPassword(user.password, payload.password)) {
            throw new UnauthorizedError('Invalid email or password');
        }

        return buildAuthResponse(user);
    }
}

export default AuthController;
