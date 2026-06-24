import {
    Body,
    Delete,
    Get,
    Patch,
    Req,
    UseBefore,
} from 'routing-controllers';
import { IsOptional, IsString, MinLength } from 'class-validator';
import { Type } from 'class-transformer';

import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';

import { User } from '../models/user.entity';

import authMiddleware, {
    RequestWithUser,
} from '../middlewares/auth.middleware';
import dataSource from '../config/data-source';
import { Order } from '../models/order.entity';
import { Review } from '../models/review.entity';

class UserUpdateDto {
    @IsOptional()
    @IsString()
    @Type(() => String)
    first_name?: string;

    @IsOptional()
    @IsString()
    @Type(() => String)
    last_name?: string;

    @IsOptional()
    @IsString()
    @Type(() => String)
    phone?: string;

    @IsOptional()
    @IsString()
    @MinLength(8)
    @Type(() => String)
    password?: string;
}

@EntityController({
    baseRoute: '/users',
    entity: User,
})
class UserController extends BaseController {
    @Get('/me')
    @UseBefore(authMiddleware)
    async me(@Req() request: RequestWithUser) {
        const { user } = request;
        const result = await this.repository.findOneBy({ id: user.id });
        return result;
    }

    @Patch('/me')
    @UseBefore(authMiddleware)
    async updateMe(
        @Req() request: RequestWithUser,
        @Body({ type: UserUpdateDto }) dto: UserUpdateDto,
    ) {
        const me = await this.repository.findOneBy({ id: request.user.id });
        if (!me) return null;

        Object.assign(me, {
            ...(dto.first_name !== undefined ? { first_name: dto.first_name } : {}),
            ...(dto.last_name !== undefined ? { last_name: dto.last_name } : {}),
            ...(dto.phone !== undefined ? { phone: dto.phone } : {}),
            ...(dto.password !== undefined ? { password: dto.password } : {}),
        });

        return await this.repository.save(me);
    }

    @Delete('/me')
    @UseBefore(authMiddleware)
    async deleteMe(@Req() request: RequestWithUser) {
        const me = await this.repository.findOneBy({ id: request.user.id });
        if (!me) return;
        await this.repository.remove(me);
        return;
    }

    @Get('/me/orders')
    @UseBefore(authMiddleware)
    async myOrders(@Req() request: RequestWithUser) {
        return await dataSource.getRepository(Order).find({
            where: { user: { id: request.user.id } },
            order: { created_at: 'DESC' },
        });
    }

    @Get('/me/reviews')
    @UseBefore(authMiddleware)
    async myReviews(@Req() request: RequestWithUser) {
        return await dataSource.getRepository(Review).find({
            where: { user: { id: request.user.id } },
            relations: { carpet: true },
            order: { created_at: 'DESC' },
        });
    }
}

export default UserController;
