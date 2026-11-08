import {
    BadRequestError,
    Body,
    Get,
    HttpCode,
    JsonController,
    Patch,
    Req,
    UnauthorizedError,
    UseBefore,
} from 'routing-controllers';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';

import dataSource from '../config/data-source';
import {
    ChangePasswordRequestDto,
    ErrorResponseDto,
    UpdateProfileRequestDto,
    UserProfileDto,
} from '../dto/api.dto';
import { toUserProfileDto } from '../mappers/api.mapper';
import authMiddleware, { RequestWithUser } from '../middlewares/auth.middleware';
import { User } from '../models';
import checkPassword from '../utils/check-password';
import hashPassword from '../utils/hash-password';

@JsonController('/users')
@UseBefore(authMiddleware)
export default class UserController {
    private userRepository = dataSource.getRepository(User);

    private async getCurrentUser(request: RequestWithUser): Promise<User> {
        const user = await this.userRepository.findOne({
            where: {
                id: request.user.id,
            },
        });

        if (!user) {
            throw new UnauthorizedError('User from token is not found');
        }

        return user;
    }

    @Get('/me')
    @OpenAPI({
        summary: 'Получить профиль текущего пользователя',
        tags: ['Users'],
        security: [{ bearerAuth: [] }],
    })
    @ResponseSchema(UserProfileDto, { statusCode: 200 })
    @ResponseSchema(ErrorResponseDto, { statusCode: 401 })
    @ResponseSchema(ErrorResponseDto, { statusCode: 404 })
    async me(@Req() request: RequestWithUser): Promise<UserProfileDto> {
        const user = await this.getCurrentUser(request);

        return toUserProfileDto(user);
    }

    @Patch('/me')
    @OpenAPI({
        summary: 'Обновить профиль текущего пользователя',
        tags: ['Users'],
        security: [{ bearerAuth: [] }],
    })
    @ResponseSchema(UserProfileDto, { statusCode: 200 })
    @ResponseSchema(ErrorResponseDto, { statusCode: 400 })
    @ResponseSchema(ErrorResponseDto, { statusCode: 401 })
    async updateMe(
        @Req() request: RequestWithUser,
        @Body({ validate: true, type: UpdateProfileRequestDto })
        payload: UpdateProfileRequestDto,
    ): Promise<UserProfileDto> {
        const user = await this.getCurrentUser(request);

        if (Object.keys(payload).length === 0) {
            throw new BadRequestError('Nothing to update');
        }

        if (payload.bio !== undefined) {
            user.bio = payload.bio;
        }

        if (payload.avatarUrl !== undefined) {
            user.avatarUrl = payload.avatarUrl;
        }

        const updatedUser = await this.userRepository.save(user);

        return toUserProfileDto(updatedUser);
    }

    @Patch('/me/password')
    @HttpCode(204)
    @OpenAPI({
        summary: 'Изменить пароль текущего пользователя',
        tags: ['Users'],
        security: [{ bearerAuth: [] }],
    })
    @ResponseSchema(ErrorResponseDto, { statusCode: 400 })
    @ResponseSchema(ErrorResponseDto, { statusCode: 401 })
    @ResponseSchema(ErrorResponseDto, { statusCode: 404 })
    async changePassword(
        @Req() request: RequestWithUser,
        @Body({ validate: true, type: ChangePasswordRequestDto })
        payload: ChangePasswordRequestDto,
    ): Promise<void> {
        const user = await this.getCurrentUser(request);

        if (!checkPassword(user.passwordHash, payload.currentPassword)) {
            throw new BadRequestError('Current password is incorrect');
        }

        if (payload.currentPassword === payload.newPassword) {
            throw new BadRequestError('New password must differ from current password');
        }

        user.passwordHash = hashPassword(payload.newPassword);
        await this.userRepository.save(user);
    }
}
