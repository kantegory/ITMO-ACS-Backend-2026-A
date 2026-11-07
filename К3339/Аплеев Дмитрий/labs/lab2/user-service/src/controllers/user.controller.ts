import {
    Body,
    Get,
    Patch,
    UseBefore,
    Req,
    HttpError,
    NotFoundError,
} from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';
import { IsString, IsEmail, IsOptional, Length } from 'class-validator';
import { Type } from 'class-transformer';

import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';

import { User } from '../models/user.entity';

import authMiddleware, {
    RequestWithUser,
} from '../middlewares/auth.middleware';

class UpdateMeDto {
    @IsOptional()
    @IsString()
    @Length(3, 50)
    @Type(() => String)
    username?: string;

    @IsOptional()
    @IsEmail()
    @Type(() => String)
    email?: string;
}

@EntityController({
    baseRoute: '/v1/users',
    entity: User,
})
class UserController extends BaseController {
    // /me должен быть выше /:id, иначе "me" посчитается за id
    @Get('/me')
    @UseBefore(authMiddleware)
    @OpenAPI({ summary: 'Мой профиль', security: [{ bearerAuth: [] }] })
    async me(@Req() request: RequestWithUser) {
        const user = await this.repository.findOneBy({ id: request.user.id });

        if (!user) {
            throw new NotFoundError('User not found');
        }

        delete user.password;
        return user;
    }

    @Patch('/me')
    @UseBefore(authMiddleware)
    @OpenAPI({
        summary: 'Изменить мой профиль',
        security: [{ bearerAuth: [] }],
    })
    async updateMe(
        @Req() request: RequestWithUser,
        @Body({ type: UpdateMeDto }) updateData: UpdateMeDto,
    ) {
        const user = await this.repository.findOneBy({ id: request.user.id });

        if (!user) {
            throw new NotFoundError('User not found');
        }

        if (updateData.email && updateData.email !== user.email) {
            const userWithEmail = await this.repository.findOneBy({
                email: updateData.email,
            });
            if (userWithEmail) {
                throw new HttpError(409, 'Email already in use');
            }
            user.email = updateData.email;
        }

        if (updateData.username && updateData.username !== user.username) {
            const userWithUsername = await this.repository.findOneBy({
                username: updateData.username,
            });
            if (userWithUsername) {
                throw new HttpError(409, 'Username already in use');
            }
            user.username = updateData.username;
        }

        const savedUser = await this.repository.save(user);

        delete savedUser.password;
        return savedUser;
    }

    @Get('/:id')
    @OpenAPI({ summary: 'Публичный профиль пользователя' })
    async getProfile(@Req() request: RequestWithUser) {
        // id берём из request.params: @Param('id') ломает генерацию Swagger при запуске через tsx
        const id = Number(request.params.id);
        const user = await this.repository.findOneBy({ id });

        if (!user) {
            throw new NotFoundError('User not found');
        }

        // количество рецептов и подписчиков хранится в других сервисах,
        // их добавляет bff-service
        return {
            id: user.id,
            username: user.username,
            created_at: user.created_at,
        };
    }
}

export default UserController;
