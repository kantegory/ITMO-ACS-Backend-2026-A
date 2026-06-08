import { Get, Post, Param, Body, UseBefore, NotFoundError, UnauthorizedError } from 'routing-controllers';
import { In } from 'typeorm';
import jwt from 'jsonwebtoken';

import EntityController from '../../../shared/entity-controller';
import BaseController from '../../../shared/base-controller';
import { internalGuard } from '../../../shared/internal-client';

import dataSource from '../data-source';
import { User } from '../models/user.entity';

const JWT_SECRET = process.env.JWT_SECRET_KEY || 'secret';

function internalUser(u: User) {
    return { id: u.id, email: u.email, firstName: u.firstName, lastName: u.lastName, role: u.role, isVerified: u.isVerified };
}

@EntityController({ baseRoute: '/internal', entity: User, dataSource })
@UseBefore(internalGuard)
class InternalController extends BaseController {
    @Post('/tokens/verify')
    async verify(@Body() body: { token: string }) {
        try {
            const payload: any = jwt.verify(body.token, JWT_SECRET);
            return { userId: payload.user.id, role: payload.user.role };
        } catch {
            throw new UnauthorizedError('Токен недействителен');
        }
    }

    @Get('/users/:id')
    async getUser(@Param('id') id: number) {
        const user = (await this.repository.findOneBy({ id })) as unknown as User;
        if (!user) throw new NotFoundError('Пользователь не найден');
        return internalUser(user);
    }

    @Post('/users/batch')
    async batch(@Body() body: { ids: number[] }) {
        const users = (await this.repository.findBy({ id: In(body.ids || []) })) as unknown as User[];
        return users.map(internalUser);
    }
}

export default InternalController;
