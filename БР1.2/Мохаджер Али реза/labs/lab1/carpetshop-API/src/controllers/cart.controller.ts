import {
    BadRequestError,
    Body,
    Delete,
    Get,
    NotFoundError,
    Param,
    Patch,
    Post,
    Req,
    UseBefore,
} from 'routing-controllers';
import { IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';
import authMiddleware, { RequestWithUser } from '../middlewares/auth.middleware';
import dataSource from '../config/data-source';
import { Cart } from '../models/cart.entity';
import { CartItem } from '../models/cart-item.entity';
import { Carpet } from '../models/carpet.entity';

class CartItemCreateDto {
    @IsInt()
    @Type(() => Number)
    carpet_id: number;

    @IsInt()
    @Min(1)
    @Type(() => Number)
    quantity: number;
}

class CartItemUpdateDto {
    @IsInt()
    @Min(1)
    @Type(() => Number)
    quantity: number;
}

async function getOrCreateCart(userId: number) {
    const cartRepo = dataSource.getRepository(Cart);
    let cart = await cartRepo.findOne({ where: { user: { id: userId } }, relations: { user: true } });
    if (!cart) {
        cart = cartRepo.create({ user: { id: userId } as any });
        cart = await cartRepo.save(cart);
    }
    return cart;
}

async function buildCartRead(userId: number) {
    const cart = await getOrCreateCart(userId);
    const itemRepo = dataSource.getRepository(CartItem);

    const items = await itemRepo.find({
        where: { cart: { id: cart.id } },
        relations: { carpet: { category: true } },
        order: { created_at: 'ASC' },
    });

    const mappedItems = items.map((i) => {
        const price = Number(i.carpet.price);
        const subtotal = price * i.quantity;
        return {
            id: i.id,
            carpet: i.carpet,
            quantity: i.quantity,
            subtotal,
            created_at: i.created_at,
        };
    });

    const total_price = mappedItems.reduce((sum, it) => sum + it.subtotal, 0);

    return {
        id: cart.id,
        items: mappedItems,
        total_price,
        created_at: cart.created_at,
        updated_at: cart.updated_at,
    };
}

@EntityController({ baseRoute: '/cart', entity: Cart })
export default class CartController extends BaseController {
    @Get('')
    @UseBefore(authMiddleware)
    async get(@Req() request: RequestWithUser) {
        return await buildCartRead(request.user.id);
    }

    @Post('/items')
    @UseBefore(authMiddleware)
    async addItem(@Req() request: RequestWithUser, @Body({ type: CartItemCreateDto }) dto: CartItemCreateDto) {
        const carpet = await dataSource.getRepository(Carpet).findOneBy({ id: dto.carpet_id });
        if (!carpet) throw new NotFoundError('Carpet not found');
        if (carpet.stock < dto.quantity) throw new BadRequestError('Not enough stock');

        const cart = await getOrCreateCart(request.user.id);
        const itemRepo = dataSource.getRepository(CartItem);

        const existing = await itemRepo.findOne({
            where: { cart: { id: cart.id }, carpet: { id: dto.carpet_id } },
            relations: { cart: true, carpet: true },
        });

        if (existing) {
            const newQty = existing.quantity + dto.quantity;
            if (carpet.stock < newQty) throw new BadRequestError('Not enough stock');
            existing.quantity = newQty;
            await itemRepo.save(existing);
        } else {
            const item = itemRepo.create({
                cart: { id: cart.id } as any,
                carpet: { id: dto.carpet_id } as any,
                quantity: dto.quantity,
            });
            await itemRepo.save(item);
        }

        return await buildCartRead(request.user.id);
    }

    @Patch('/items/:item_id')
    @UseBefore(authMiddleware)
    async updateItem(
        @Req() request: RequestWithUser,
        @Param('item_id') itemId: number,
        @Body({ type: CartItemUpdateDto }) dto: CartItemUpdateDto,
    ) {
        const cart = await getOrCreateCart(request.user.id);
        const itemRepo = dataSource.getRepository(CartItem);

        const item = await itemRepo.findOne({
            where: { id: itemId, cart: { id: cart.id } },
            relations: { carpet: true, cart: true },
        });
        if (!item) throw new NotFoundError('Cart item not found');

        if (item.carpet.stock < dto.quantity) throw new BadRequestError('Not enough stock');
        item.quantity = dto.quantity;
        await itemRepo.save(item);

        return await buildCartRead(request.user.id);
    }

    @Delete('/items/:item_id')
    @UseBefore(authMiddleware)
    async removeItem(@Req() request: RequestWithUser, @Param('item_id') itemId: number) {
        const cart = await getOrCreateCart(request.user.id);
        const itemRepo = dataSource.getRepository(CartItem);

        const item = await itemRepo.findOne({ where: { id: itemId, cart: { id: cart.id } } });
        if (!item) throw new NotFoundError('Cart item not found');

        await itemRepo.remove(item);
        return await buildCartRead(request.user.id);
    }

    @Delete('/clear')
    @UseBefore(authMiddleware)
    async clear(@Req() request: RequestWithUser) {
        const cart = await getOrCreateCart(request.user.id);
        await dataSource.getRepository(CartItem).delete({ cart: { id: cart.id } as any });
        return;
    }
}

