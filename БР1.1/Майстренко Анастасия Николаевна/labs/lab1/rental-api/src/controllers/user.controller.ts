import {
    Get,
    Patch,
    Put,
    Delete,
    Param,
    QueryParam,
    Body,
    Req,
    UseBefore,
    NotFoundError,
    OnUndefined,
} from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';

import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';
import dataSource from '../config/data-source';

import { User } from '../models/user.entity';
import { Property } from '../models/property.entity';
import { Booking } from '../models/booking.entity';

import authMiddleware, {
    RequestWithUser,
} from '../middlewares/auth.middleware';
import { UpdateUserDto } from '../dto/user.dto';
import { paginate } from '../utils/paginate';

function publicUser(user: User | null) {
    if (!user) return null;
    const { password, ...rest } = user;
    return rest;
}

@EntityController({ baseRoute: '/users', entity: User })
class UserController extends BaseController {
    private properties = dataSource.getRepository(Property);
    private bookings = dataSource.getRepository(Booking);

    @Get('/me')
    @UseBefore(authMiddleware)
    @OpenAPI({ summary: 'Профиль текущего пользователя', security: [{ bearerAuth: [] }] })
    async me(@Req() req: RequestWithUser) {
        const user = await this.repository.findOneBy({ id: req.user.id });
        if (!user) throw new NotFoundError('Пользователь не найден');
        return publicUser(user as unknown as User);
    }

    @Patch('/me')
    @UseBefore(authMiddleware)
    @OpenAPI({ summary: 'Обновление профиля', security: [{ bearerAuth: [] }] })
    async updateMe(@Req() req: RequestWithUser, @Body() data: UpdateUserDto) {
        const user = await this.repository.findOneBy({ id: req.user.id });
        if (!user) throw new NotFoundError('Пользователь не найден');
        Object.assign(user, data);
        const saved = await this.repository.save(user);
        return publicUser(saved as unknown as User);
    }

    @Get('/me/properties')
    @UseBefore(authMiddleware)
    @OpenAPI({ summary: 'Объекты, сдаваемые пользователем', security: [{ bearerAuth: [] }] })
    async myProperties(
        @Req() req: RequestWithUser,
        @QueryParam('page') page: number,
        @QueryParam('limit') limit: number,
    ) {
        const qb = this.properties
            .createQueryBuilder('p')
            .where('p.ownerId = :id', { id: req.user.id })
            .orderBy('p.createdAt', 'DESC');
        return paginate(qb, page, limit);
    }

    @Get('/me/rentals')
    @UseBefore(authMiddleware)
    @OpenAPI({ summary: 'Объекты, арендуемые пользователем', security: [{ bearerAuth: [] }] })
    async myRentals(
        @Req() req: RequestWithUser,
        @QueryParam('status') status: string,
        @QueryParam('page') page: number,
        @QueryParam('limit') limit: number,
    ) {
        const qb = this.bookings
            .createQueryBuilder('b')
            .leftJoinAndSelect('b.property', 'property')
            .where('b.tenantId = :id', { id: req.user.id });
        if (status) qb.andWhere('b.status = :status', { status });
        qb.orderBy('b.createdAt', 'DESC');
        return paginate(qb, page, limit);
    }

    @Get('/me/favorites')
    @UseBefore(authMiddleware)
    @OpenAPI({ summary: 'Избранные объекты', security: [{ bearerAuth: [] }] })
    async favorites(@Req() req: RequestWithUser) {
        const user = await this.repository.findOne({
            where: { id: req.user.id },
            relations: { favorites: true },
        });
        return (user as unknown as User)?.favorites ?? [];
    }

    @Put('/me/favorites/:propertyId')
    @UseBefore(authMiddleware)
    @OnUndefined(204)
    @OpenAPI({ summary: 'Добавить объект в избранное', security: [{ bearerAuth: [] }] })
    async addFavorite(
        @Req() req: RequestWithUser,
        @Param('propertyId') propertyId: number,
    ) {
        const property = await this.properties.findOneBy({ id: propertyId });
        if (!property) throw new NotFoundError('Объект не найден');
        await this.repository
            .createQueryBuilder()
            .relation(User, 'favorites')
            .of(req.user.id)
            .add(propertyId)
            .catch(() => undefined); // игнорируем повторное добавление
        return undefined;
    }

    @Delete('/me/favorites/:propertyId')
    @UseBefore(authMiddleware)
    @OnUndefined(204)
    @OpenAPI({ summary: 'Убрать объект из избранного', security: [{ bearerAuth: [] }] })
    async removeFavorite(
        @Req() req: RequestWithUser,
        @Param('propertyId') propertyId: number,
    ) {
        await this.repository
            .createQueryBuilder()
            .relation(User, 'favorites')
            .of(req.user.id)
            .remove(propertyId);
        return undefined;
    }

    @Get('/:id')
    @OpenAPI({ summary: 'Публичный профиль пользователя' })
    async getById(@Param('id') id: number) {
        const user = await this.repository.findOneBy({ id });
        if (!user) throw new NotFoundError('Пользователь не найден');
        const pub = publicUser(user as unknown as User) as any;
        delete pub.email;
        delete pub.phone;
        return pub;
    }
}

export default UserController;
