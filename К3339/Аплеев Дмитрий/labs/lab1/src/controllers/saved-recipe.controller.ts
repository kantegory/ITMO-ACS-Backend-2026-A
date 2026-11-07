import {
    Get,
    Put,
    Delete,
    UseBefore,
    Req,
    OnUndefined,
    NotFoundError,
} from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';

import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';
import dataSource from '../config/data-source';

import { SavedRecipe } from '../models/saved-recipe.entity';
import { Recipe } from '../models/recipe.entity';
import { Like } from '../models/like.entity';

import authMiddleware, {
    RequestWithUser,
} from '../middlewares/auth.middleware';

@EntityController({
    baseRoute: '',
    entity: SavedRecipe,
})
class SavedRecipeController extends BaseController {
    @Get('/users/me/saved')
    @UseBefore(authMiddleware)
    @OpenAPI({
        summary: 'Мои сохранённые рецепты',
        security: [{ bearerAuth: [] }],
        parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer' } },
            { name: 'limit', in: 'query', schema: { type: 'integer' } },
        ],
    })
    async getMySaved(@Req() request: RequestWithUser) {
        const page = Number(request.query.page) || 1;
        const limit = Number(request.query.limit) || 20;

        const [savedRecipes, total] = await this.repository.findAndCount({
            where: { user_id: request.user.id },
            relations: { recipe: { author: true } },
            order: { created_at: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
        });

        const items = [];
        for (const saved of savedRecipes) {
            const recipe = saved.recipe;
            const likesCount = await dataSource
                .getRepository(Like)
                .countBy({ recipe_id: recipe.id });

            items.push({
                id: recipe.id,
                title: recipe.title,
                dish_type: recipe.dish_type,
                difficulty: recipe.difficulty,
                cooking_time: recipe.cooking_time,
                image_url: recipe.image_url,
                author: {
                    id: recipe.author.id,
                    username: recipe.author.username,
                },
                likes_count: likesCount,
            });
        }

        return { items, total, page, limit };
    }

    @Put('/recipes/:id/save')
    @OnUndefined(204)
    @UseBefore(authMiddleware)
    @OpenAPI({ summary: 'Сохранить рецепт', security: [{ bearerAuth: [] }] })
    async save(@Req() request: RequestWithUser) {
        const recipeId = Number(request.params.id);

        const recipe = await dataSource
            .getRepository(Recipe)
            .findOneBy({ id: recipeId });
        if (!recipe) {
            throw new NotFoundError('Recipe not found');
        }

        const existing = await this.repository.findOneBy({
            recipe_id: recipeId,
            user_id: request.user.id,
        });

        if (!existing) {
            await this.repository.save({
                recipe_id: recipeId,
                user_id: request.user.id,
            });
        }
    }

    @Delete('/recipes/:id/save')
    @OnUndefined(204)
    @UseBefore(authMiddleware)
    @OpenAPI({
        summary: 'Убрать из сохранённых',
        security: [{ bearerAuth: [] }],
    })
    async unsave(@Req() request: RequestWithUser) {
        const recipeId = Number(request.params.id);

        const recipe = await dataSource
            .getRepository(Recipe)
            .findOneBy({ id: recipeId });
        if (!recipe) {
            throw new NotFoundError('Recipe not found');
        }

        await this.repository.delete({
            recipe_id: recipeId,
            user_id: request.user.id,
        });
    }
}

export default SavedRecipeController;
