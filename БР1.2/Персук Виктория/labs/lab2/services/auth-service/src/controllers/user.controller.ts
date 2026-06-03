import { Body, Get, Patch, UseBefore, Req } from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';
import axios from 'axios';

import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';
import { User } from '../models/user.entity';
import authMiddleware, { RequestWithUser } from '../middlewares/auth.middleware';
import { UpdateUserDto } from '../dto/user.dto';
import SETTINGS from '../config/settings';

@EntityController({ baseRoute: '/users', entity: User })
class UserController extends BaseController {
    @Get('/me')
    @UseBefore(authMiddleware)
    @OpenAPI({ summary: 'Get current user profile', security: [{ bearerAuth: [] }] })
    async me(@Req() request: RequestWithUser) {
        const { user } = request;
        return await this.repository.findOne({
            where: { user_id: user.id },
            relations: ['role'],
        });
    }

    @Patch('/me')
    @UseBefore(authMiddleware)
    @OpenAPI({ summary: 'Update current user profile', security: [{ bearerAuth: [] }] })
    async updateMe(
        @Req() request: RequestWithUser,
        @Body({ type: UpdateUserDto }) updateData: UpdateUserDto,
    ) {
        const { user } = request;
        const existingUser = await this.repository.findOneBy({ user_id: user.id });
        if (!existingUser) {
            return { message: 'User not found' };
        }

        const allowed: (keyof UpdateUserDto)[] = ['first_name', 'middle_name', 'last_name', 'phone'];
        for (const key of allowed) {
            if (updateData[key] !== undefined) {
                (existingUser as any)[key] = updateData[key];
            }
        }

        return await this.repository.save(existingUser);
    }

    @Get('/me/reservations')
    @UseBefore(authMiddleware)
    @OpenAPI({ summary: 'Get current user reservations', security: [{ bearerAuth: [] }] })
    async myReservations(@Req() request: RequestWithUser) {
        const { user } = request;
        try {
            const { data } = await axios.get(
                `${SETTINGS.RESERVATION_SERVICE_URL}/internal/reservations`,
                { params: { user_id: user.id } },
            );
            return data;
        } catch {
            return [];
        }
    }
}

export default UserController;
