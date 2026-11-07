import { Body, Post, UseBefore } from 'routing-controllers';
import { In } from 'typeorm';

import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';
import internalAuthMiddleware from '../middlewares/internal-auth.middleware';
import { serializeUser } from '../common/serializers';
import { User } from '../models/user.entity';

@EntityController({
    baseRoute: '/internal/v1/users',
    entity: User,
})
class InternalUserController extends BaseController {
    @Post('/batch')
    @UseBefore(internalAuthMiddleware)
    async getUsersBatch(@Body() body: { ids?: string[] }) {
        const ids = [...new Set(body.ids ?? [])];
        const users = ids.length
            ? ((await this.repository.findBy({ id: In(ids) })) as User[])
            : [];
        const foundIds = new Set(users.map((user) => user.id));

        return {
            items: users.map((user) => serializeUser(user)),
            missingIds: ids.filter((id) => !foundIds.has(id)),
        };
    }
}

export default InternalUserController;
