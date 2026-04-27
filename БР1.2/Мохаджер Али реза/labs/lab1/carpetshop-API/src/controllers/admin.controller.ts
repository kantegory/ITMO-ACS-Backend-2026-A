import {
    Body,
    Delete,
    Get,
    NotFoundError,
    Param,
    Patch,
    QueryParam,
    Req,
    UseBefore,
} from 'routing-controllers';
import { IsIn } from 'class-validator';
import { Type } from 'class-transformer';

import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';
import authMiddleware, { RequestWithUser } from '../middlewares/auth.middleware';
import requireAdmin from '../middlewares/require-admin.middleware';
import dataSource from '../config/data-source';
import { User } from '../models/user.entity';
import { Order, OrderStatus } from '../models/order.entity';

class RoleUpdateDto {
    @IsIn(['ADMIN', 'SELLER', 'CUSTOMER'])
    @Type(() => String)
    role: 'ADMIN' | 'SELLER' | 'CUSTOMER';
}

class OrderStatusUpdateDto {
    @IsIn(['PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELED'])
    @Type(() => String)
    status: OrderStatus;
}

@EntityController({ baseRoute: '/admin', entity: User })
export default class AdminController extends BaseController {
    @Get('/users')
    @UseBefore(authMiddleware, requireAdmin)
    async users(@QueryParam('limit') limit = 50, @QueryParam('offset') offset = 0) {
        return await dataSource.getRepository(User).find({
            take: limit,
            skip: offset,
            order: { created_at: 'DESC' },
        });
    }

    @Get('/users/:id')
    @UseBefore(authMiddleware, requireAdmin)
    async userById(@Param('id') id: number) {
        const user = await dataSource.getRepository(User).findOneBy({ id });
        if (!user) throw new NotFoundError('User not found');
        return user;
    }

    @Delete('/users/:id')
    @UseBefore(authMiddleware, requireAdmin)
    async deleteUser(@Param('id') id: number) {
        const repo = dataSource.getRepository(User);
        const user = await repo.findOneBy({ id });
        if (!user) throw new NotFoundError('User not found');
        await repo.remove(user);
        return;
    }

    @Patch('/users/:id/role')
    @UseBefore(authMiddleware, requireAdmin)
    async updateRole(
        @Param('id') id: number,
        @Req() _req: RequestWithUser,
        @Body({ type: RoleUpdateDto }) body: RoleUpdateDto,
    ) {
        const repo = dataSource.getRepository(User);
        const user = await repo.findOneBy({ id });
        if (!user) throw new NotFoundError('User not found');
        user.role = body.role;
        return await repo.save(user);
    }

    @Get('/orders')
    @UseBefore(authMiddleware, requireAdmin)
    async orders(
        @QueryParam('status') status?: OrderStatus,
        @QueryParam('limit') limit = 50,
        @QueryParam('offset') offset = 0,
    ) {
        const repo = dataSource.getRepository(Order);
        const where = status ? { status } : {};
        return await repo.find({
            where: where as any,
            take: limit,
            skip: offset,
            order: { created_at: 'DESC' },
        });
    }

    @Patch('/orders/:id/status')
    @UseBefore(authMiddleware, requireAdmin)
    async updateOrderStatus(@Param('id') id: number, @Body({ type: OrderStatusUpdateDto }) body: OrderStatusUpdateDto) {
        const repo = dataSource.getRepository(Order);
        const order = await repo.findOneBy({ id });
        if (!order) throw new NotFoundError('Order not found');

        order.status = body.status;
        return await repo.save(order);
    }
}

