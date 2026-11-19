import {
    Param,
    Body,
    Get,
    Post,
    Patch,
    UseBefore,
    Req,
    Res,
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
        return await this.repository.find();
    }

    @Post('')
    async create(@Body() user: User) {
        const createdUser = this.repository.create(user);
        const results = await this.repository.save(createdUser);

        return results;
    }

    @Get('/me')
    @UseBefore(authMiddleware)
    async me(@Req() request: RequestWithUser) {
        const { user } = request;
        const results = await this.repository.findOneBy({ id: user.id });

        return results;
    }

    @Get('/:id')
    @UseBefore(authMiddleware)
    async getById(@Param('id') id: number): Promise<ObjectLiteral> {
        const results = await this.repository.findOneBy({ id });

        return results;
    }

    @Patch('/:id')
    @UseBefore(authMiddleware)
    async update(
        @Param('id') id: number,
        @Body() user: Partial<User>,
    ): Promise<ObjectLiteral> {
        const userForUpdate = await this.repository.findOneBy({ id });
        Object.assign(userForUpdate, user);

        const results = await this.repository.save(userForUpdate);

        return results;
    }
}

export default UserController;
