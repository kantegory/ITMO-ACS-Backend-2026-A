import {
    JsonController,
    Get,
    Put,
    Delete,
    Req,
    Res,
} from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';
import { Request, Response } from 'express';

import SETTINGS from '../config/settings';
import { callService, sendResult } from '../utils/call-service';
import { addAuthorsAndLikes } from '../utils/collect-data';

@JsonController('/v1')
class SavedRecipeController {
    @Get('/users/me/saved')
    @OpenAPI({
        summary: 'Мои сохранённые рецепты',
        security: [{ bearerAuth: [] }],
        parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer' } },
            { name: 'limit', in: 'query', schema: { type: 'integer' } },
        ],
    })
    async getMySaved(@Req() request: Request, @Res() response: Response) {
        const queryString = request.originalUrl.split('?')[1] || '';

        // 1. id сохранённых рецептов — social-service
        const savedResult = await callService(
            'GET',
            `${SETTINGS.SOCIAL_SERVICE_URL}/v1/users/me/saved?${queryString}`,
            request,
        );
        if (savedResult.status !== 200) {
            return sendResult(response, savedResult);
        }

        const recipeIds: number[] = savedResult.data.recipe_ids;
        let items = [];

        if (recipeIds.length > 0) {
            // 2. сами рецепты — recipe-service
            const recipesResult = await callService(
                'GET',
                `${SETTINGS.RECIPE_SERVICE_URL}/v1/internal/recipes?ids=${recipeIds.join(',')}`,
            );

            // сохраняем порядок из social-service (сначала новые),
            // рецепты, которых уже нет, пропускаем
            const recipes = [];
            for (const id of recipeIds) {
                const recipe = recipesResult.data.find((r) => r.id === id);
                if (recipe) {
                    recipes.push(recipe);
                }
            }

            // 3. имена авторов и лайки — user-service и social-service
            items = await addAuthorsAndLikes(recipes);
        }

        return response.json({
            items,
            total: savedResult.data.total,
            page: savedResult.data.page,
            limit: savedResult.data.limit,
        });
    }

    @Put('/recipes/:id/save')
    @OpenAPI({ summary: 'Сохранить рецепт', security: [{ bearerAuth: [] }] })
    async save(@Req() request: Request, @Res() response: Response) {
        const result = await callService(
            'PUT',
            `${SETTINGS.SOCIAL_SERVICE_URL}/v1/recipes/${request.params.id}/save`,
            request,
        );

        return sendResult(response, result);
    }

    @Delete('/recipes/:id/save')
    @OpenAPI({
        summary: 'Убрать из сохранённых',
        security: [{ bearerAuth: [] }],
    })
    async unsave(@Req() request: Request, @Res() response: Response) {
        const result = await callService(
            'DELETE',
            `${SETTINGS.SOCIAL_SERVICE_URL}/v1/recipes/${request.params.id}/save`,
            request,
        );

        return sendResult(response, result);
    }
}

export default SavedRecipeController;
