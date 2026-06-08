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
import axios from 'axios';
import dataSource from '../config/data-source';
import { User } from '../models/user.entity';
import { roleMiddleware } from '../middlewares/role.middleware';
import { extractUserMiddleware } from '../middlewares/extract-user.middleware';

@JsonController('/admin')
@UseBefore(extractUserMiddleware)
export class AdminController {
    private userRepo = dataSource.getRepository(User);
    private recipeUrl =
        process.env.RECIPE_SERVICE_URL || 'http://localhost:8002';
    private socialUrl =
        process.env.SOCIAL_SERVICE_URL || 'http://localhost:8003';

    @Delete('/users/:id/ban')
    @HttpCode(204)
    @UseBefore(roleMiddleware(['admin']))
    async banUser(@Param('id') id: string) {
        const user = await this.userRepo.findOneBy({ id });
        if (!user) throw new HttpError(404, 'Пользователь не найден');
        if (user.role === 'admin')
            throw new HttpError(403, 'Нельзя забанить администратора');

        user.is_banned = true;
        await this.userRepo.save(user);
        await this.userRepo.softDelete(id);

        // Сообщаем другим сервисам, что контент нужно скрыть
        try {
            await axios.delete(
                `${this.recipeUrl}/internal/recipes/by-author/${id}`,
            );
            await axios.delete(
                `${this.socialUrl}/internal/social/by-user/${id}`,
            );
        } catch (err) {
            console.error('Ошибка каскадного удаления контента', err);
        }

        return null;
    }

    @Patch('/users/:id/role')
    @UseBefore(roleMiddleware(['admin']))
    async changeUserRole(
        @Param('id') id: string,
        @Body() body: { role: string },
    ) {
        if (!['user', 'moderator', 'admin'].includes(body.role))
            throw new HttpError(400, 'Недопустимая роль');
        const user = await this.userRepo.findOneBy({ id });
        if (!user) throw new HttpError(404, 'Пользователь не найден');

        user.role = body.role;
        return await this.userRepo.save(user);
    }
}
