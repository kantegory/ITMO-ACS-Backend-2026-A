import {
    Body,
    Get,
    Patch,
    UseBefore,
    Req,
} from 'routing-controllers';

import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';

import { User } from '../models/user.entity';

import authMiddleware, {
    RequestWithUser,
} from '../middlewares/auth.middleware';

@EntityController({
    baseRoute: '/users',
    entity: User,
})
class UserController extends BaseController {
    @UseBefore(authMiddleware)
    @Patch('/me')
    async updateMe(
        @Req() request: RequestWithUser,
        @Body()
        body: Partial<Pick<User, 'name' | 'phone' | 'another_contact'>>,
    ): Promise<{ success: boolean }> {
        const { user } = request;
        const userForUpdate = await this.repository.findOneBy({ id: user.id });

        Object.assign(userForUpdate, body);
        await this.repository.save(userForUpdate);

        return { success: true };
    }

    @UseBefore(authMiddleware)
    @Get('/me')
    async me(@Req() request: RequestWithUser) {
        const { user } = request;
        const results = await this.repository.findOneBy({ id: user.id });

        return results;
    }
}

export default UserController;
