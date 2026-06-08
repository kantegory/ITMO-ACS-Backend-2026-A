import {
    JsonController,
    Delete,
    Patch,
    Param,
    Body,
    UseBefore,
    HttpCode,
    HttpError,
} from 'routing-controllers';
import dataSource from '../config/data-source';
import authMiddleware from '../middlewares/auth.middleware';
import roleMiddleware from '../middlewares/role.middleware';
import { Recipe } from '../models/recipe.entity';
import { BlogPost } from '../models/blog-post.entity';
import { Comment } from '../models/comment.entity';
import { User } from '../models/user.entity';

@JsonController('/admin')
export class AdminController {
    private recipeRepo = dataSource.getRepository(Recipe);
    private blogRepo = dataSource.getRepository(BlogPost);
    private commentRepo = dataSource.getRepository(Comment);
    private userRepo = dataSource.getRepository(User);

    @Delete('/recipes/:id')
    @HttpCode(204)
    @UseBefore(authMiddleware, roleMiddleware(['admin', 'moderator']))
    async deleteRecipe(@Param('id') id: string) {
        const result = await this.recipeRepo.softDelete(id);
        if (result.affected === 0) throw new HttpError(404, 'Рецепт не найден');
        return null;
    }

    @Delete('/blogs/:id')
    @HttpCode(204)
    @UseBefore(authMiddleware, roleMiddleware(['admin', 'moderator']))
    async deleteBlogPost(@Param('id') id: string) {
        const result = await this.blogRepo.softDelete(id);
        if (result.affected === 0) throw new HttpError(404, 'Пост не найден');
        return null;
    }

    @Delete('/comments/:id')
    @HttpCode(204)
    @UseBefore(authMiddleware, roleMiddleware(['admin', 'moderator']))
    async deleteComment(@Param('id') id: string) {
        const result = await this.commentRepo.softDelete(id);
        if (result.affected === 0)
            throw new HttpError(404, 'Комментарий не найден');
        return null;
    }

    @Delete('/users/:id/ban')
    @HttpCode(204)
    @UseBefore(authMiddleware, roleMiddleware(['admin']))
    async banUser(@Param('id') id: string) {
        const user = await this.userRepo.findOneBy({ id });
        if (!user) throw new HttpError(404, 'Пользователь не найден');
        if (user.role === 'admin')
            throw new HttpError(403, 'Нельзя забанить другого администратора');

        user.is_banned = true;
        await this.userRepo.save(user);

        await this.userRepo.softDelete(id);
        return null;
    }

    @Patch('/users/:id/role')
    @UseBefore(authMiddleware, roleMiddleware(['admin']))
    async changeUserRole(
        @Param('id') id: string,
        @Body() body: { role: string },
    ) {
        if (!['user', 'moderator', 'admin'].includes(body.role)) {
            throw new HttpError(400, 'Недопустимая роль');
        }

        const user = await this.userRepo.findOneBy({ id });
        if (!user) throw new HttpError(404, 'Пользователь не найден');

        user.role = body.role;
        await this.userRepo.save(user);

        delete (user as any).password_hash;
        return user;
    }
}
