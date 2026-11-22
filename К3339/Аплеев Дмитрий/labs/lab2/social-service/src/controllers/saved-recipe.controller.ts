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

import { SavedRecipe } from '../models/saved-recipe.entity';

import authMiddleware, {
    RequestWithUser,
} from '../middlewares/auth.middleware';
import { recipeExists } from '../utils/check-exists';

@EntityController({
    baseRoute: '/v1',
    entity: SavedRecipe,
})
class SavedRecipeController extends BaseController {
    @Get('/users/me/saved')
    @UseBefore(authMiddleware)
    @OpenAPI({
        summary: 'Мои сохранённые рецепты (id)',
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
            order: { created_at: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
        });

        // сами рецепты лежат в recipe-service, их по id подтягивает bff-service
        return {
            recipe_ids: savedRecipes.map((saved) => saved.recipe_id),
            total,
            page,
            limit,
        };
    }

    @Put('/recipes/:id/save')
    @OnUndefined(204)
    @UseBefore(authMiddleware)
    @OpenAPI({ summary: 'Сохранить рецепт', security: [{ bearerAuth: [] }] })
    async save(@Req() request: RequestWithUser) {
        const recipeId = Number(request.params.id);

        if (!(await recipeExists(recipeId))) {
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

        if (!(await recipeExists(recipeId))) {
            throw new NotFoundError('Recipe not found');
        }

        await this.repository.delete({
            recipe_id: recipeId,
            user_id: request.user.id,
        });
    }
}

export default SavedRecipeController;
