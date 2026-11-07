import { Get, Req, NotFoundError } from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';
import { Request } from 'express';
import { In } from 'typeorm';

import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';

import { Recipe } from '../models/recipe.entity';

// внутренние эндпоинты: их вызывают другие сервисы, а не клиент
@EntityController({
    baseRoute: '/v1/internal/recipes',
    entity: Recipe,
})
class InternalController extends BaseController {
    // GET /v1/internal/recipes?ids=10,12 — карточки рецептов (для списка сохранённых в bff-service)
    @Get('')
    @OpenAPI({
        summary: 'Карточки нескольких рецептов',
        parameters: [
            {
                name: 'ids',
                in: 'query',
                required: true,
                schema: { type: 'string', example: '10,12' },
            },
        ],
    })
    async getMany(@Req() request: Request) {
        // "10,12" -> [10, 12]
        const ids = String(request.query.ids || '')
            .split(',')
            .map((id) => Number(id))
            .filter((id) => id > 0);

        if (ids.length === 0) {
            return [];
        }

        const recipes = await this.repository.findBy({ id: In(ids) });

        return recipes.map((recipe) => ({
            id: recipe.id,
            title: recipe.title,
            dish_type: recipe.dish_type,
            difficulty: recipe.difficulty,
            cooking_time: recipe.cooking_time,
            image_url: recipe.image_url,
            author_id: recipe.author_id,
        }));
    }

    // GET /v1/internal/recipes/10 — существует ли рецепт (для social-service)
    @Get('/:id')
    @OpenAPI({ summary: 'Проверка существования рецепта' })
    async getOne(@Req() request: Request) {
        const id = Number(request.params.id);
        const recipe = await this.repository.findOneBy({ id });

        if (!recipe) {
            throw new NotFoundError('Recipe not found');
        }

        return { id: recipe.id, author_id: recipe.author_id };
    }
}

export default InternalController;
