import {
    Get, Post, Param, QueryParam, Body, Req, UseBefore, HttpCode, NotFoundError,
} from 'routing-controllers';
import { In } from 'typeorm';

import EntityController from '../../../shared/entity-controller';
import BaseController from '../../../shared/base-controller';
import authMiddleware, { RequestWithUser } from '../../../shared/auth.middleware';
import { paginate } from '../../../shared/paginate';

import dataSource from '../data-source';
import { Property, PropertyStatus } from '../models/property.entity';
import { Amenity } from '../models/amenity.entity';
import { CreatePropertyDto } from '../dto/catalog.dto';

@EntityController({ baseRoute: '/properties', entity: Property, dataSource })
class PropertyController extends BaseController {
    private amenities = dataSource.getRepository(Amenity);

    @Get('')
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
    async getOne(@Param('id') id: number) {
        const property = await this.repository.findOne({
            where: { id },
            relations: { amenities: true },
        });
        if (!property) throw new NotFoundError('Объект не найден');
        return property;
    }

    @Post('')
    @HttpCode(201)
    @UseBefore(authMiddleware)
    async create(@Req() req: RequestWithUser, @Body() data: CreatePropertyDto) {
        const { amenityIds, ...fields } = data;
        const property = this.repository.create({ ...fields, ownerId: req.user.id });
        if (amenityIds && amenityIds.length) {
            property.amenities = await this.amenities.findBy({ id: In(amenityIds) });
        }
        return this.repository.save(property);
    }
}

export default PropertyController;
