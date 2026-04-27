import {
    BadRequestError,
    Body,
    Get,
    NotFoundError,
    Param,
    Post,
    Req,
    UseBefore,
} from 'routing-controllers';
import { IsString } from 'class-validator';
import { Type } from 'class-transformer';

import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';
import authMiddleware, { RequestWithUser } from '../middlewares/auth.middleware';
import dataSource from '../config/data-source';
import { Order } from '../models/order.entity';
import { OrderItem } from '../models/order-item.entity';
import { Cart } from '../models/cart.entity';
import { CartItem } from '../models/cart-item.entity';
import { Carpet } from '../models/carpet.entity';
import { assertAdminOrOwner } from '../utils/ownership';

class OrderCreateDto {
    @IsString()
    @Type(() => String)
    address: string;
}

@EntityController({ baseRoute: '/orders', entity: Order })
export default class OrdersController extends BaseController {
    @Post('')
    @UseBefore(authMiddleware)
    async create(@Req() request: RequestWithUser, @Body({ type: OrderCreateDto }) dto: OrderCreateDto) {
        const cart = await dataSource.getRepository(Cart).findOne({
            where: { user: { id: request.user.id } },
            relations: { user: true },
        });
        if (!cart) throw new BadRequestError('Cart is empty');

        const cartItems = await dataSource.getRepository(CartItem).find({
            where: { cart: { id: cart.id } },
            relations: { carpet: true },
        });
        if (cartItems.length === 0) throw new BadRequestError('Cart is empty');

        // stock check
        for (const it of cartItems) {
            if (it.carpet.stock < it.quantity) {
                throw new BadRequestError('Not enough stock');
            }
        }

        const orderRepo = dataSource.getRepository(Order);
        const itemRepo = dataSource.getRepository(OrderItem);
        const carpetRepo = dataSource.getRepository(Carpet);

        const order = orderRepo.create({
            user: { id: request.user.id } as any,
            address: dto.address,
            status: 'PENDING',
            total_price: '0',
        });
        const savedOrder = await orderRepo.save(order);

        let total = 0;
        for (const it of cartItems) {
            const price = Number(it.carpet.price);
            total += price * it.quantity;

            const oi = itemRepo.create({
                order: { id: savedOrder.id } as any,
                carpet: { id: it.carpet.id } as any,
                price: String(price),
                quantity: it.quantity,
            });
            await itemRepo.save(oi);

            it.carpet.stock -= it.quantity;
            await carpetRepo.save(it.carpet);
        }

        savedOrder.total_price = String(total);
        await orderRepo.save(savedOrder);

        await dataSource.getRepository(CartItem).delete({ cart: { id: cart.id } as any });

        return await orderRepo.findOne({
            where: { id: savedOrder.id },
            relations: { user: true, items: { carpet: { category: true } } },
        });
    }

    @Get('/:id')
    @UseBefore(authMiddleware)
    async getById(@Req() request: RequestWithUser, @Param('id') id: number) {
        const order = await dataSource.getRepository(Order).findOne({
            where: { id },
            relations: { user: true, items: { carpet: { category: true } } },
        });
        if (!order) throw new NotFoundError('Order not found');

        assertAdminOrOwner({
            requesterUserId: request.user.id,
            requesterRole: request.user.role,
            ownerUserId: order.user.id,
        });

        return order;
    }

    @Post('/:id/cancel')
    @UseBefore(authMiddleware)
    async cancel(@Req() request: RequestWithUser, @Param('id') id: number) {
        const repo = dataSource.getRepository(Order);
        const order = await repo.findOne({
            where: { id },
            relations: { user: true, items: { carpet: true } },
        });
        if (!order) throw new NotFoundError('Order not found');

        assertAdminOrOwner({
            requesterUserId: request.user.id,
            requesterRole: request.user.role,
            ownerUserId: order.user.id,
        });

        if (order.status !== 'PENDING') {
            throw new BadRequestError('Order cannot be canceled');
        }

        order.status = 'CANCELED';
        await repo.save(order);

        // restore stock
        const carpetRepo = dataSource.getRepository(Carpet);
        for (const it of order.items) {
            it.carpet.stock += it.quantity;
            await carpetRepo.save(it.carpet);
        }

        return await repo.findOne({
            where: { id },
            relations: { user: true, items: { carpet: { category: true } } },
        });
    }
}

