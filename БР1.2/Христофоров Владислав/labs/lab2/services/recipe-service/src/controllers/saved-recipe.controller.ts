import {
    JsonController,
    Get,
    QueryParam,
    Req,
    UseBefore,
} from 'routing-controllers';
import dataSource from '../config/data-source';
import { SavedRecipe } from '../models/saved-recipe.entity';
import { extractUserMiddleware } from '../middlewares/extract-user.middleware';
import { Request } from 'express';

@JsonController('/users/me/saved-recipes')
export class SavedRecipeController {
    private savedRepo = dataSource.getRepository(SavedRecipe);

    @Get('/')
    @UseBefore(extractUserMiddleware)
    async getSavedRecipes(
        @Req() req: Request,
        @QueryParam('limit') limit: number = 20,
        @QueryParam('offset') offset: number = 0,
    ) {
        const userId = (req as any).user.id;
        const saved = await this.savedRepo.find({
            where: { user_id: userId },
            relations: {
                recipe: {
                    dish_types: {
                        dish_type: true,
                    },
                },
            },
            take: limit,
            skip: offset,
        });
        return saved.map((s) => s.recipe);
    }
}
