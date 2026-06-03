import { Get, JsonController, Param, QueryParam, NotFoundError } from 'routing-controllers';
import { In } from 'typeorm';
import dataSource from '../config/data-source';
import { User } from '../models/user.entity';

@JsonController('/internal')
class InternalController {
    private get repo() {
        return dataSource.getRepository(User);
    }

    @Get('/users/:id')
    async getUserById(@Param('id') id: number) {
        const user = await this.repo.findOne({
            where: { user_id: id },
            relations: ['role'],
        });
        if (!user) {
            throw new NotFoundError('User not found');
        }
        return {
            user_id: user.user_id,
            email: user.email,
            role: user.role?.name || null,
        };
    }

    @Get('/users')
    async getUsersByIds(@QueryParam('ids') ids: string) {
        if (!ids) {
            return { message: 'ids parameter is required' };
        }
        const idList = ids.split(',').map(Number).filter(Boolean);
        const users = await this.repo.find({
            where: { user_id: In(idList) },
            relations: ['role'],
        });
        return users.map((u) => ({
            user_id: u.user_id,
            email: u.email,
            role: u.role?.name || null,
        }));
    }
}

export default InternalController;
