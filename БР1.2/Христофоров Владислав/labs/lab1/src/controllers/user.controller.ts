import {
    JsonController,
    Get,
    Patch,
    Post,
    Delete,
    Param,
    Body,
    HttpError,
    Req,
    UseBefore,
    HttpCode,
} from 'routing-controllers';
import dataSource from '../config/data-source';
import authMiddleware from '../middlewares/auth.middleware';
import { User } from '../models/user.entity';
import { Subscription } from '../models/subscription.entity';
import { SavedRecipe } from '../models/saved-recipe.entity';
import { UpdateUserDto } from '../dto/update-user.dto';
import { Request } from 'express';

@JsonController('/users')
export class UserController {
    private userRepo = dataSource.getRepository(User);
    private subRepo = dataSource.getRepository(Subscription);
    private savedRepo = dataSource.getRepository(SavedRecipe);

    @Get('/me')
    @UseBefore(authMiddleware)
    async me(@Req() req: Request) {
        const user = await this.userRepo.findOneBy({
            id: (req as any).user.id,
        });
        if (!user) throw new HttpError(404, 'Пользователь не найден');
        return user;
    }

    @Patch('/me')
    @UseBefore(authMiddleware)
    async updateMe(@Body() body: UpdateUserDto, @Req() req: Request) {
        const user = await this.userRepo.findOneBy({
            id: (req as any).user.id,
        });
        if (!user) throw new HttpError(404, 'Пользователь не найден');
        Object.assign(user, body);
        return await this.userRepo.save(user);
    }

    @Get('/me/saved-recipes')
    @UseBefore(authMiddleware)
    async getSavedRecipes(@Req() req: Request) {
        const saved = await this.savedRepo.find({
            where: { user: { id: (req as any).user.id } },
            relations: ['recipe'],
        });
        return saved.map((s) => s.recipe);
    }

    @Get('/:id')
    async getById(@Param('id') id: string) {
        const user = await this.userRepo.findOneBy({ id });
        if (!user) throw new HttpError(404, 'Пользователь не найден');
        return user;
    }

    @Post('/:id/subscribe')
    @HttpCode(201)
    @UseBefore(authMiddleware)
    async subscribe(@Param('id') id: string, @Req() req: Request) {
        const followerId = (req as any).user.id;
        if (followerId === id)
            throw new HttpError(400, 'Нельзя подписаться на себя');
        const existing = await this.subRepo.findOneBy({
            follower: { id: followerId },
            following: { id },
        });
        if (!existing)
            await this.subRepo.save(
                this.subRepo.create({
                    follower: { id: followerId },
                    following: { id },
                }),
            );
        return { message: 'Подписка оформлена' };
    }

    @Delete('/:id/subscribe')
    @HttpCode(204)
    @UseBefore(authMiddleware)
    async unsubscribe(@Param('id') id: string, @Req() req: Request) {
        await this.subRepo.delete({
            follower: { id: (req as any).user.id },
            following: { id },
        });
        return null;
    }
}
