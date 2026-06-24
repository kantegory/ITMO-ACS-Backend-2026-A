import {
    Body,
    Get,
    Patch,
    UseBefore,
    Req,
} from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';
import { IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';
import { User } from '../models/user.entity';
import { Reservation } from '../models/reservation.entity';
import authMiddleware, { RequestWithUser } from '../middlewares/auth.middleware';
import dataSource from '../config/data-source';

class UpdateUserDto {
    @IsOptional()
    @IsString()
    @Type(() => String)
    first_name?: string;

    @IsOptional()
    @IsString()
    @Type(() => String)
    middle_name?: string;

    @IsOptional()
    @IsString()
    @Type(() => String)
    last_name?: string;

    @IsOptional()
    @IsString()
    @Type(() => String)
    phone?: string;
}

@EntityController({
    baseRoute: '/users',
    entity: User,
})
class UserController extends BaseController {
    @Get('/me')
    @UseBefore(authMiddleware)
    @OpenAPI({ summary: 'Get current user profile', security: [{ bearerAuth: [] }] })
    async me(@Req() request: RequestWithUser) {
        const { user } = request;
        const result = await this.repository.findOne({
            where: { user_id: user.id },
            relations: ['role'],
        });
        return result;
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
        const reservationRepo = dataSource.getRepository(Reservation);
        const reservations = await reservationRepo.find({
            where: { user_id: user.id },
            relations: ['table', 'table.restaurant'],
        });
        return reservations;
    }
}

export default UserController;
