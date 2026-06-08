import {
    JsonController,
    Delete,
    Param,
    UseBefore,
    HttpCode,
    HttpError,
} from 'routing-controllers';
import dataSource from '../config/data-source';
import { Recipe } from '../models/recipe.entity';
import { roleMiddleware } from '../middlewares/role.middleware';
import { extractUserMiddleware } from '../middlewares/extract-user.middleware';

@JsonController('/admin')
@UseBefore(extractUserMiddleware)
export class AdminController {
    private recipeRepo = dataSource.getRepository(Recipe);

    @Delete('/recipes/:id')
    @HttpCode(204)
    @UseBefore(roleMiddleware(['admin', 'moderator']))
    async deleteRecipe(@Param('id') id: string) {
        const result = await this.recipeRepo.softDelete(id);
        if (result.affected === 0) throw new HttpError(404, 'Рецепт не найден');
        return null;
    }
}
