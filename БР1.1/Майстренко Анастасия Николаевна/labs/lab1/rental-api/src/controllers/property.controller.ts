import {
    Get,
    Post,
    Patch,
    Delete,
    Param,
    QueryParam,
    Body,
    Req,
    UseBefore,
    HttpCode,
    OnUndefined,
    NotFoundError,
    ForbiddenError,
} from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';
import { In } from 'typeorm';

import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';
import dataSource from '../config/data-source';

import { Property } from '../models/property.entity';
import { Amenity } from '../models/amenity.entity';
import { PropertyPhoto } from '../models/property-photo.entity';
import { Review } from '../models/review.entity';
import { PropertyStatus } from '../models/enums';

import authMiddleware, {
    RequestWithUser,
} from '../middlewares/auth.middleware';
import { CreatePropertyDto, UpdatePropertyDto } from '../dto/property.dto';
import { paginate } from '../utils/paginate';

@EntityController({ baseRoute: '/properties', entity: Property })
class PropertyController extends BaseController {
    private amenities = dataSource.getRepository(Amenity);
    private photos = dataSource.getRepository(PropertyPhoto);
    private reviews = dataSource.getRepository(Review);

    @Get('')
    @OpenAPI({ summary: 'Поиск недвижимости с фильтрацией' })
    async search(
        @QueryParam('type') type: string,
        @QueryParam('priceMin') priceMin: number,
        @QueryParam('priceMax') priceMax: number,
        @QueryParam('city') city: string,
        @QueryParam('rooms') rooms: number,
        @QueryParam('sort') sort: string,
        @QueryParam('page') page: number,
        @QueryParam('limit') limit: number,
    ) {
        const qb = this.repository
            .createQueryBuilder('p')
            .leftJoinAndSelect('p.photos', 'photos')
            .where('p.status = :status', { status: PropertyStatus.AVAILABLE });

        if (type) qb.andWhere('p.propertyType = :type', { type });
        if (priceMin) qb.andWhere('p.pricePerDay >= :priceMin', { priceMin });
        if (priceMax) qb.andWhere('p.pricePerDay <= :priceMax', { priceMax });
        if (city) qb.andWhere('LOWER(p.city) LIKE LOWER(:city)', { city: `%${city}%` });
        if (rooms) qb.andWhere('p.rooms = :rooms', { rooms });

        if (sort === 'price_asc') qb.orderBy('p.pricePerDay', 'ASC');
        else if (sort === 'price_desc') qb.orderBy('p.pricePerDay', 'DESC');
        else qb.orderBy('p.createdAt', 'DESC');

        return paginate(qb, page, limit);
    }

    @Get('/:id')
    @OpenAPI({ summary: 'Страница объекта недвижимости' })
    async getOne(@Param('id') id: number) {
        const property = await this.repository.findOne({
            where: { id },
            relations: { owner: true, photos: true, amenities: true },
        });
        if (!property) throw new NotFoundError('Объект не найден');

        const reviews = await this.reviews
            .createQueryBuilder('r')
            .innerJoin('r.booking', 'b')
            .where('b.propertyId = :id', { id })
            .getMany();
        const reviewsCount = reviews.length;
        const rating = reviewsCount
            ? reviews.reduce((s, r) => s + r.rating, 0) / reviewsCount
            : null;

        const result: any = { ...property };
        if (result.owner) delete result.owner.password;
        result.rating = rating;
        result.reviewsCount = reviewsCount;
        return result;
    }

    @Post('')
    @HttpCode(201)
    @UseBefore(authMiddleware)
    @OpenAPI({ summary: 'Создать объект недвижимости', security: [{ bearerAuth: [] }] })
    async create(@Req() req: RequestWithUser, @Body() data: CreatePropertyDto) {
        const { amenityIds, ...fields } = data;
        const property = this.repository.create({
            ...fields,
            ownerId: req.user.id,
        });

        if (amenityIds && amenityIds.length) {
            property.amenities = await this.amenities.findBy({
                id: In(amenityIds),
            });
        }

        return this.repository.save(property);
    }

    @Patch('/:id')
    @UseBefore(authMiddleware)
    @OpenAPI({ summary: 'Обновить объект (только владелец)', security: [{ bearerAuth: [] }] })
    async update(
        @Req() req: RequestWithUser,
        @Param('id') id: number,
        @Body() data: UpdatePropertyDto,
    ) {
        const property = await this.repository.findOneBy({ id });
        if (!property) throw new NotFoundError('Объект не найден');
        if (property.ownerId !== req.user.id) {
            throw new ForbiddenError('Можно редактировать только свои объекты');
        }

        const { amenityIds, ...fields } = data;
        Object.assign(property, fields);
        if (amenityIds) {
            property.amenities = await this.amenities.findBy({
                id: In(amenityIds),
            });
        }
        return this.repository.save(property);
    }

    @Delete('/:id')
    @UseBefore(authMiddleware)
    @OnUndefined(204)
    @OpenAPI({ summary: 'Удалить объект (только владелец)', security: [{ bearerAuth: [] }] })
    async remove(@Req() req: RequestWithUser, @Param('id') id: number) {
        const property = await this.repository.findOneBy({ id });
        if (!property) throw new NotFoundError('Объект не найден');
        if (property.ownerId !== req.user.id) {
            throw new ForbiddenError('Можно удалять только свои объекты');
        }
        await this.repository.remove(property);
        return undefined;
    }

    @Post('/:id/photos')
    @HttpCode(201)
    @UseBefore(authMiddleware)
    @OpenAPI({ summary: 'Добавить фотографию объекта', security: [{ bearerAuth: [] }] })
    async addPhoto(
        @Req() req: RequestWithUser,
        @Param('id') id: number,
        @Body() body: { url: string; ordering?: number },
    ) {
        const property = await this.repository.findOneBy({ id });
        if (!property) throw new NotFoundError('Объект не найден');
        if (property.ownerId !== req.user.id) {
            throw new ForbiddenError('Можно добавлять фото только к своим объектам');
        }
        const photo = this.photos.create({
            propertyId: id,
            url: body.url,
            ordering: body.ordering ?? 0,
        });
        return this.photos.save(photo);
    }

    @Delete('/:id/photos/:photoId')
    @UseBefore(authMiddleware)
    @OnUndefined(204)
    @OpenAPI({ summary: 'Удалить фотографию объекта', security: [{ bearerAuth: [] }] })
    async removePhoto(
        @Req() req: RequestWithUser,
        @Param('id') id: number,
        @Param('photoId') photoId: number,
    ) {
        const property = await this.repository.findOneBy({ id });
        if (!property) throw new NotFoundError('Объект не найден');
        if (property.ownerId !== req.user.id) {
            throw new ForbiddenError('Нет прав на изменение объекта');
        }
        await this.photos.delete({ id: photoId, propertyId: id });
        return undefined;
    }

    @Get('/:id/reviews')
    @OpenAPI({ summary: 'Отзывы по объекту' })
    async reviewsList(
        @Param('id') id: number,
        @QueryParam('page') page: number,
        @QueryParam('limit') limit: number,
    ) {
        const qb = this.reviews
            .createQueryBuilder('r')
            .innerJoin('r.booking', 'b')
            .where('b.propertyId = :id', { id })
            .orderBy('r.createdAt', 'DESC');
        return paginate(qb, page, limit);
    }
}

export default PropertyController;
