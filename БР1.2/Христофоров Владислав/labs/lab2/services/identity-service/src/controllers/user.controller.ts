import {
    JsonController,
    Get,
    Patch,
    Delete,
    Param,
    Body,
    HttpError,
    Req,
    UseBefore,
    HttpCode,
} from 'routing-controllers';
import axios from 'axios';
import dataSource from '../config/data-source';
import { User } from '../models/user.entity';
import { UpdateUserDto } from '../dto/update-user.dto';
import { Request } from 'express';
import { extractUserMiddleware } from '../middlewares/extract-user.middleware';

@JsonController('/users')
@UseBefore(extractUserMiddleware)
export class UserController {
    private userRepo = dataSource.getRepository(User);
    private recipeUrl =
        process.env.RECIPE_SERVICE_URL || 'http://localhost:8002';
    private socialUrl =
        process.env.SOCIAL_SERVICE_URL || 'http://localhost:8003';

    @Get('/me')
    async me(@Req() req: Request) {
        const userId = (req as any).user?.id;
        if (!userId) throw new HttpError(401, 'Unauthorized');

        const user = await this.userRepo.findOneBy({ id: userId });
        if (!user) throw new HttpError(404, 'Пользователь не найден');
        return user;
    }

    @Patch('/me')
    async updateMe(@Body() body: UpdateUserDto, @Req() req: Request) {
        const userId = (req as any).user?.id;
        if (!userId) throw new HttpError(401, 'Unauthorized');

        const user = await this.userRepo.findOneBy({ id: userId });
        if (!user) throw new HttpError(404, 'Пользователь не найден');

        Object.assign(user, body);
        return await this.userRepo.save(user);
    }

    @Delete('/me')
    @HttpCode(204)
    async deleteMe(@Req() req: Request) {
        const userId = (req as any).user?.id;
        if (!userId) throw new HttpError(401, 'Unauthorized');

        const user = await this.userRepo.findOneBy({ id: userId });
        if (!user) throw new HttpError(404, 'Пользователь не найден');

        await this.userRepo.softDelete(userId);

        try {
            await axios.delete(
                `${this.recipeUrl}/internal/recipes/by-author/${userId}`,
            );
            await axios.delete(
                `${this.socialUrl}/internal/social/by-user/${userId}`,
            );
        } catch (err) {
            console.error(
                'Ошибка каскадного удаления контента при удалении профиля',
                err,
            );
        }

        return null;
    }

    @Get('/:id')
    async getById(@Param('id') id: string) {
        const user = await this.userRepo.findOneBy({ id });
        if (!user) throw new HttpError(404, 'Пользователь не найден');
        return user;
    }
}
