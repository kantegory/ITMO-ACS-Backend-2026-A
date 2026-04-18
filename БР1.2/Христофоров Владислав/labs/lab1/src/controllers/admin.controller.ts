import {
    JsonController,
    Delete,
    Param,
    HttpError,
    UseBefore,
    HttpCode,
} from 'routing-controllers';
import dataSource from '../config/data-source';
import authMiddleware from '../middlewares/auth.middleware';
import { RoleMiddleware } from '../middlewares/role.middleware';
import { Recipe } from '../models/recipe.entity';
import { Comment } from '../models/comment.entity';

@JsonController('/admin')
export class AdminController {
    private recipeRepo = dataSource.getRepository(Recipe);
    private commentRepo = dataSource.getRepository(Comment);

    @Delete('/recipes/:id')
    @HttpCode(204)
    @UseBefore(authMiddleware, RoleMiddleware(['admin', 'moderator']))
    async deleteRecipe(@Param('id') id: string) {
        const result = await this.recipeRepo.softDelete(id);
        if (!result.affected) throw new HttpError(404, 'Рецепт не найден');
        return null;
    }

    @Delete('/comments/:id')
    @HttpCode(204)
    @UseBefore(authMiddleware, RoleMiddleware(['admin', 'moderator']))
    async deleteComment(@Param('id') id: string) {
        const result = await this.commentRepo.softDelete(id);
        if (!result.affected) throw new HttpError(404, 'Комментарий не найден');
        return null;
    }
}
