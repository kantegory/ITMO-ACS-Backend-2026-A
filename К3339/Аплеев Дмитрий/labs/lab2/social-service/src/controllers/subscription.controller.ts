import {
    Get,
    Put,
    Delete,
    UseBefore,
    Req,
    OnUndefined,
    BadRequestError,
    NotFoundError,
} from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';

import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';

import { Subscription } from '../models/subscription.entity';

import authMiddleware, {
    RequestWithUser,
} from '../middlewares/auth.middleware';
import { userExists } from '../utils/check-exists';

@EntityController({
    baseRoute: '/v1/users',
    entity: Subscription,
})
class SubscriptionController extends BaseController {
    @Get('/me/subscriptions')
    @UseBefore(authMiddleware)
    @OpenAPI({
        summary: 'На кого я подписан (id)',
        security: [{ bearerAuth: [] }],
    })
    async getMySubscriptions(@Req() request: RequestWithUser) {
        const subscriptions = await this.repository.find({
            where: { follower_id: request.user.id },
            order: { created_at: 'DESC' },
        });

        // имена авторов добавляет bff-service
        return subscriptions.map((subscription) => subscription.author_id);
    }

    // PUT: повторная подписка ничего не меняет и не считается ошибкой
    @Put('/:id/subscribe')
    @OnUndefined(204)
    @UseBefore(authMiddleware)
    @OpenAPI({
        summary: 'Подписаться на пользователя',
        security: [{ bearerAuth: [] }],
    })
    async subscribe(@Req() request: RequestWithUser) {
        const authorId = Number(request.params.id);

        if (authorId === request.user.id) {
            throw new BadRequestError('You cannot subscribe to yourself');
        }

        if (!(await userExists(authorId))) {
            throw new NotFoundError('User not found');
        }

        const existing = await this.repository.findOneBy({
            follower_id: request.user.id,
            author_id: authorId,
        });

        if (!existing) {
            await this.repository.save({
                follower_id: request.user.id,
                author_id: authorId,
            });
        }
    }

    @Delete('/:id/subscribe')
    @OnUndefined(204)
    @UseBefore(authMiddleware)
    @OpenAPI({ summary: 'Отписаться', security: [{ bearerAuth: [] }] })
    async unsubscribe(@Req() request: RequestWithUser) {
        const authorId = Number(request.params.id);

        if (!(await userExists(authorId))) {
            throw new NotFoundError('User not found');
        }

        await this.repository.delete({
            follower_id: request.user.id,
            author_id: authorId,
        });
    }
}

export default SubscriptionController;
