import { Get, Req, UseBefore, NotFoundError } from 'routing-controllers';

import EntityController from '../../../shared/entity-controller';
import BaseController from '../../../shared/base-controller';
import authMiddleware, { RequestWithUser } from '../../../shared/auth.middleware';

import dataSource from '../data-source';
import { User } from '../models/user.entity';

@EntityController({ baseRoute: '/users', entity: User, dataSource })
class UserController extends BaseController {
    @Get('/me')
    @UseBefore(authMiddleware)
    async me(@Req() req: RequestWithUser) {
        const user = (await this.repository.findOneBy({ id: req.user.id })) as unknown as User;
        if (!user) throw new NotFoundError('Пользователь не найден');
        const { password, ...rest } = user;
        return rest;
    }
}

export default UserController;
