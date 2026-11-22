import {
    JsonController,
    Body,
    Get,
    Patch,
    Req,
    Res,
} from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';
import { IsString, IsEmail, IsOptional, Length } from 'class-validator';
import { Type } from 'class-transformer';
import { Request, Response } from 'express';

import SETTINGS from '../config/settings';
import { callService, sendResult } from '../utils/call-service';

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

@JsonController('/v1/users')
class UserController {
    // /me должен быть выше /:id, иначе "me" посчитается за id
    @Get('/me')
    @OpenAPI({ summary: 'Мой профиль', security: [{ bearerAuth: [] }] })
    async me(@Req() request: Request, @Res() response: Response) {
        const result = await callService(
            'GET',
            `${SETTINGS.USER_SERVICE_URL}/v1/users/me`,
            request,
        );

        return sendResult(response, result);
    }

    @Patch('/me')
    @OpenAPI({
        summary: 'Изменить мой профиль',
        security: [{ bearerAuth: [] }],
    })
    async updateMe(
        @Req() request: Request,
        @Res() response: Response,
        @Body({ type: UpdateMeDto }) updateData: UpdateMeDto,
    ) {
        const result = await callService(
            'PATCH',
            `${SETTINGS.USER_SERVICE_URL}/v1/users/me`,
            request,
            updateData,
        );

        return sendResult(response, result);
    }

    // профиль собирается из трёх сервисов
    @Get('/:id')
    @OpenAPI({ summary: 'Публичный профиль пользователя' })
    async getProfile(@Req() request: Request, @Res() response: Response) {
        const id = request.params.id;

        // 1. сам пользователь — user-service
        const userResult = await callService(
            'GET',
            `${SETTINGS.USER_SERVICE_URL}/v1/users/${id}`,
        );
        if (userResult.status !== 200) {
            return sendResult(response, userResult);
        }

        // 2. количество рецептов — recipe-service (поле total в поиске по автору)
        const recipesResult = await callService(
            'GET',
            `${SETTINGS.RECIPE_SERVICE_URL}/v1/recipes?author_id=${id}&limit=1`,
        );

        // 3. количество подписчиков — social-service
        const followersResult = await callService(
            'GET',
            `${SETTINGS.SOCIAL_SERVICE_URL}/v1/internal/users/${id}/followers-count`,
        );

        return response.json({
            id: userResult.data.id,
            username: userResult.data.username,
            recipes_count: recipesResult.data.total,
            followers_count: followersResult.data.count,
            created_at: userResult.data.created_at,
        });
    }
}

export default UserController;
