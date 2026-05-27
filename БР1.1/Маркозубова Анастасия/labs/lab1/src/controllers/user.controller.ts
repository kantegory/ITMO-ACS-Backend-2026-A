import {
    Param,
    Body,
    Get,
    Patch,
    UseBefore,
    Req,
} from 'routing-controllers';
import { ObjectLiteral } from 'typeorm';

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
    @Get('')
    async getAll() {
        const users = await this.repository.find();
        return users;
    }

    @Get('/me')
    @UseBefore(authMiddleware)
    async me(@Req() request: RequestWithUser) {
        const currentUserId = request.user.user_id;

        const user = await this.repository.findOneBy({
            user_id: currentUserId,
        });

        return user;
    }

    @Get('/:id')
    @UseBefore(authMiddleware)
    async getById(@Param('id') id: number) {
        const user = await this.repository.findOneBy({
            user_id: id,
        });

        return user;
    }

    @Patch('/:id')
    @UseBefore(authMiddleware)
    async update(
        @Param('id') id: number,
        @Body() data: Partial<User>,
    ) {
        const user = await this.repository.findOneBy({
            user_id: id,
        });

        Object.assign(user, data);

        const updatedUser = await this.repository.save(user);
        return updatedUser;
    }
}

export default UserController;
