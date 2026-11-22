import { Get, Req, NotFoundError } from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';
import { Request } from 'express';
import { In } from 'typeorm';

import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';

import { User } from '../models/user.entity';

@EntityController({
    baseRoute: '/v1/internal/users',
    entity: User,
})
class InternalController extends BaseController {
    @Get('')
    @OpenAPI({
        summary: 'Короткие данные нескольких пользователей',
        parameters: [
            {
                name: 'ids',
                in: 'query',
                required: true,
                schema: { type: 'string', example: '1,2,3' },
            },
        ],
    })
    async getMany(@Req() request: Request) {
        const ids = String(request.query.ids || '')
            .split(',')
            .map((id) => Number(id))
            .filter((id) => id > 0);

        if (ids.length === 0) {
            return [];
        }

        const users = await this.repository.findBy({ id: In(ids) });

        return users.map((user) => ({ id: user.id, username: user.username }));
    }

    @Get('/:id')
    @OpenAPI({ summary: 'Проверка существования пользователя' })
    async getOne(@Req() request: Request) {
        const id = Number(request.params.id);
        const user = await this.repository.findOneBy({ id });

        if (!user) {
            throw new NotFoundError('User not found');
        }

        return { id: user.id, username: user.username };
    }
}

export default InternalController;
