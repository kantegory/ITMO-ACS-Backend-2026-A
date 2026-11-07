import {
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

import { Like } from '../models/like.entity';

import authMiddleware, {
    RequestWithUser,
} from '../middlewares/auth.middleware';
import { recipeExists } from '../utils/check-exists';

@EntityController({
    baseRoute: '/v1/recipes',
    entity: Like,
})
class LikeController extends BaseController {
    // PUT: повторный лайк ничего не меняет и не считается ошибкой
    @Put('/:id/like')
    @OnUndefined(204)
    @UseBefore(authMiddleware)
    @OpenAPI({ summary: 'Поставить лайк', security: [{ bearerAuth: [] }] })
    async like(@Req() request: RequestWithUser) {
        const recipeId = Number(request.params.id);

        if (!(await recipeExists(recipeId))) {
            throw new NotFoundError('Recipe not found');
        }

        const existingLike = await this.repository.findOneBy({
            recipe_id: recipeId,
            user_id: request.user.id,
        });

        if (!existingLike) {
            await this.repository.save({
                recipe_id: recipeId,
                user_id: request.user.id,
            });
        }
    }

    @Delete('/:id/like')
    @OnUndefined(204)
    @UseBefore(authMiddleware)
    @OpenAPI({ summary: 'Убрать лайк', security: [{ bearerAuth: [] }] })
    async unlike(@Req() request: RequestWithUser) {
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

export default LikeController;
