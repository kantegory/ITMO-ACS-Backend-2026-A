import { Router } from 'express';
import { RecipeService } from '../services/recipe.service.js';
import { RecipeReadListSchema } from '../schemas/recipe.schemas.js';
import type { Difficulty } from '../generated/prisma/client';

const internalRouter = Router();

// Получить рецепты по списку authorId (для feed)
internalRouter.get('/internal/recipes/by-authors', async (req, res) => {
    try {
        const { 
            authorIds: authorIdsStr,
            page: pageStr = '1', 
            limit: limitStr = '20',
            search = '',
            dishTypeIds: dishTypeIdsStr = '',
            ingredientIds: ingredientIdsStr = '',
            difficulty = '',
        } = req.query as Record<string, string>;

        if (!authorIdsStr) {
            res.status(400).json({ message: 'Параметр authorIds обязателен' });
            return;
        }

        const authorIds = authorIdsStr.split(',').map(id => parseInt(id.trim()));
        const page = parseInt(pageStr);
        const limit = parseInt(limitStr);

        let dishTypeIds: number[] = [];
        if (dishTypeIdsStr) {
            dishTypeIds = dishTypeIdsStr.split(',').map(id => parseInt(id.trim()));
        }

        let ingredientIds: number[] = [];
        if (ingredientIdsStr) {
            ingredientIds = ingredientIdsStr.split(',').map(id => parseInt(id.trim()));
        }

        const recipes = await RecipeService.getRecipesByAuthorIds(
            authorIds,
            page,
            limit,
            search,
            dishTypeIds,
            ingredientIds,
            difficulty ? (difficulty as Difficulty) : undefined
        );

        res.status(200).json(RecipeReadListSchema.parse(recipes));
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
});

export default internalRouter;