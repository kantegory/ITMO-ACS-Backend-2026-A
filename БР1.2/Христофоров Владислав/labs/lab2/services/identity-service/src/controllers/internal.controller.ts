import {
    JsonController,
    Post,
    Get,
    Body,
    Param,
    HttpError,
    HttpCode,
} from 'routing-controllers';
import jwt from 'jsonwebtoken';
import dataSource from '../config/data-source';
import SETTINGS from '../config/settings';
import { User } from '../models/user.entity';

@JsonController('/internal/users')
export class InternalUserController {
    private userRepository = dataSource.getRepository(User);

    @Post('/validate-token')
    @HttpCode(200)
    async validateToken(@Body() body: { token: string }) {
        try {
            const decoded = jwt.verify(body.token, SETTINGS.JWT_SECRET_KEY) as {
                id: string;
                role: string;
            };

            const user = await this.userRepository.findOne({
                where: { id: decoded.id },
                withDeleted: true,
            });

            if (!user || user.is_banned || user.deleted_at) {
                throw new HttpError(
                    401,
                    'Token is valid, but user is banned or deleted',
                );
            }

            return { id: decoded.id, role: decoded.role };
        } catch (error) {
            throw new HttpError(401, 'Invalid or expired token');
        }
    }

    @Post('/bulk')
    @HttpCode(200)
    async getBulkUsers(@Body() body: { userIds: string[] }) {
        if (!body.userIds || body.userIds.length === 0) return [];

        const users = await this.userRepository
            .createQueryBuilder('user')
            .where('user.id IN (:...ids)', { ids: body.userIds })
            .select([
                'user.id',
                'user.username',
                'user.avatar_url',
                'user.role',
                'user.is_banned',
            ])
            .getMany();

        return users;
    }

    @Get('/:id/exists')
    @HttpCode(200)
    async checkUserExists(@Param('id') id: string) {
        const user = await this.userRepository.findOneBy({ id });
        if (!user) throw new HttpError(404, 'User not found');
        return { exists: true, id: user.id };
    }
}
