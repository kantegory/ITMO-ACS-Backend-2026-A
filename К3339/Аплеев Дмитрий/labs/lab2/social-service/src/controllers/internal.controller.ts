import { Get, Req } from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';
import { Request } from 'express';
import { In } from 'typeorm';

import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';
import dataSource from '../config/data-source';

import { Like } from '../models/like.entity';
import { Subscription } from '../models/subscription.entity';

// внутренние эндпоинты: их вызывают другие сервисы, а не клиент
@EntityController({
    baseRoute: '/v1/internal',
    entity: Like,
})
class InternalController extends BaseController {
    // GET /v1/internal/likes/count?recipe_ids=10,12 -> { "10": 3, "12": 0 } (для bff-service)
    @Get('/likes/count')
    @OpenAPI({
        summary: 'Количество лайков у нескольких рецептов',
        parameters: [
            {
                name: 'recipe_ids',
                in: 'query',
                required: true,
                schema: { type: 'string', example: '10,12' },
            },
        ],
    })
    async getLikesCount(@Req() request: Request) {
        const recipeIds = String(request.query.recipe_ids || '')
            .split(',')
            .map((id) => Number(id))
            .filter((id) => id > 0);

        // объект вида { id рецепта: количество лайков }
        const result: { [recipeId: number]: number } = {};
        for (const recipeId of recipeIds) {
            result[recipeId] = 0;
        }

        if (recipeIds.length === 0) {
            return result;
        }

        const likes = await this.repository.findBy({
            recipe_id: In(recipeIds),
        });

        for (const like of likes) {
            result[like.recipe_id] = result[like.recipe_id] + 1;
        }

        return result;
    }

    // GET /v1/internal/users/5/followers-count -> { "count": 2 } (для bff-service)
    @Get('/users/:id/followers-count')
    @OpenAPI({ summary: 'Количество подписчиков пользователя' })
    async getFollowersCount(@Req() request: Request) {
        const id = Number(request.params.id);
        const count = await dataSource
            .getRepository(Subscription)
            .countBy({ author_id: id });

        return { count };
    }

    // удаление данных удалённого рецепта теперь приходит через очередь
    // RabbitMQ (см. utils/rabbitmq.ts), а не через HTTP-ручку
}

export default InternalController;
