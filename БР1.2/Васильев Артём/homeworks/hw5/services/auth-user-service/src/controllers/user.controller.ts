import { Body, Get, Patch, Req, UseBefore } from 'routing-controllers';

import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';
import authMiddleware, {
    RequestWithUser,
} from '../middlewares/auth.middleware';
import { ensureConflict, ensureFound } from '../common/http-errors';
import { serializeUser } from '../common/serializers';
import { UpdateUserDto } from '../dto/user.dto';
import { User } from '../models/user.entity';

@EntityController({
    baseRoute: '/users',
    entity: User,
})
class UserController extends BaseController {
    @Get('/me')
    @UseBefore(authMiddleware)
    async me(@Req() request: RequestWithUser) {
        const user = ensureFound(
            await this.repository.findOneBy({
                id: request.user.id,
            }),
            'User not found',
        ) as User;

        return serializeUser(user);
    }

    @Patch('/me')
    @UseBefore(authMiddleware)
    async updateMe(
        @Req() request: RequestWithUser,
        @Body({ type: UpdateUserDto }) payload: UpdateUserDto,
    ) {
        const user = ensureFound(
            await this.repository.findOneBy({
                id: request.user.id,
            }),
            'User not found',
        ) as User;

        if (payload.email && payload.email !== user.email) {
            const existingUser = await this.repository.findOneBy({
                email: payload.email,
            });

            ensureConflict(!existingUser, 'Email is already in use');
        }

        Object.assign(user, {
            firstName: payload.first_name ?? user.firstName,
            lastName: payload.last_name ?? user.lastName,
            middleName:
                payload.middle_name !== undefined
                    ? payload.middle_name
                    : user.middleName,
            email: payload.email ?? user.email,
            phone: payload.phone ?? user.phone,
        });

        const updatedUser = (await this.repository.save(user)) as User;

        return serializeUser(updatedUser);
    }
}

export default UserController;
