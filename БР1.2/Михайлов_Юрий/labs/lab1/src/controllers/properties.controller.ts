import {
    BadRequestError,
    Body,
    Delete,
    ForbiddenError,
    Get,
    NotFoundError,
    Param,
    Post,
    Put,
    QueryParam,
    Req,
    UseBefore,
} from 'routing-controllers';

import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';
import authMiddleware, { RequestWithUser } from '../middlewares/auth.middleware';
import dataSource from '../config/data-source';

import { Property } from '../models/property.entity';
import { PropertyLocation } from '../models/property-location.entity';
import { PropertyImage } from '../models/property-image.entity';
import { Review } from '../models/review.entity';
import { Conversation } from '../models/conversation.entity';
import { PropertyAttributes } from '../models/property-attributes.entity';

type LocationDto = {
    address: string;
    city: string;
    country: string;
    metro_station?: string;
    latitude: number;
    longitude: number;
};

@EntityController({
    baseRoute: '/properties',
    entity: Property,
})
class PropertiesController extends BaseController {
    @Get('')
    async list(
        @QueryParam('city') city?: string,
        @QueryParam('minPrice') minPrice?: number,
        @QueryParam('maxPrice') maxPrice?: number,
        @QueryParam('type') type?: string,
    ): Promise<
        {
            id: number;
            title: string;
            price_per_month: number;
            type: string;
            city: string;
        }[]
    > {
        const qb = this.repository
            .createQueryBuilder('p')
            .leftJoin(PropertyLocation, 'l', 'l.property_id = p.id')
            .select([
                'p.id as id',
                'p.title as title',
                'p.price_per_month as price_per_month',
                'p.type as type',
                'l.city as city',
            ]);

        if (city) qb.andWhere('l.city = :city', { city });
        if (type) qb.andWhere('p.type = :type', { type });
        if (typeof minPrice === 'number')
            qb.andWhere('p.price_per_month >= :minPrice', { minPrice });
        if (typeof maxPrice === 'number')
            qb.andWhere('p.price_per_month <= :maxPrice', { maxPrice });

        const rows = await qb.getRawMany();
        return rows.map((r) => ({
            id: Number(r.id),
            title: r.title,
            price_per_month: Number(r.price_per_month),
            type: r.type,
            city: r.city,
        }));
    }

    @Get('/:id')
    async get(
        @Param('id') id: number,
    ): Promise<
        | {
              id: number;
              title: string;
              description: string;
              price_per_month: number;
              square: number;
              type: string;
              owner_id: number;
              location: LocationDto;
              images: { url: string }[];
          }
        | never
    > {
        const propertyRepo = dataSource.getRepository(Property);
        const locationRepo = dataSource.getRepository(PropertyLocation);
        const imageRepo = dataSource.getRepository(PropertyImage);

        const property = await propertyRepo.findOneBy({ id });
        if (!property) throw new NotFoundError('Property not found');

        const location = await locationRepo.findOneBy({ property_id: id });
        if (!location) throw new NotFoundError('Property location not found');

        const images = await imageRepo.findBy({ property_id: id });

        return {
            ...property,
            location: {
                address: location.address,
                city: location.city,
                country: location.country,
                metro_station: location.metro_station || undefined,
                latitude: location.latitude,
                longitude: location.longitude,
            },
            images: images.map((i) => ({ url: i.url })),
        };
    }

    @UseBefore(authMiddleware)
    @Post('')
    async create(
        @Req() request: RequestWithUser,
        @Body()
        body: {
            title: string;
            description: string;
            price_per_month: number;
            square: number;
            type: string;
            location: LocationDto;
        },
    ): Promise<{ id: number }> {
        if (!body?.location) {
            throw new BadRequestError('location is required');
        }

        const { user } = request;
        const propertyRepo = dataSource.getRepository(Property);
        const locationRepo = dataSource.getRepository(PropertyLocation);

        const created = propertyRepo.create({
            title: body.title,
            description: body.description,
            price_per_month: body.price_per_month,
            square: body.square,
            type: body.type,
            owner_id: user.id,
        });
        const saved = await propertyRepo.save(created);

        const location = locationRepo.create({
            property_id: saved.id,
            ...body.location,
            metro_station: body.location.metro_station ?? null,
        });
        await locationRepo.save(location);

        return { id: saved.id };
    }

    @UseBefore(authMiddleware)
    @Put('/:id')
    async update(
        @Req() request: RequestWithUser,
        @Param('id') id: number,
        @Body()
        body: {
            title: string;
            description: string;
            price_per_month: number;
            square: number;
            type: string;
        },
    ): Promise<{ success: boolean }> {
        const { user } = request;
        const property = await this.repository.findOneBy({ id });
        if (!property) throw new NotFoundError('Property not found');
        if (property.owner_id !== user.id) throw new ForbiddenError();

        Object.assign(property, body);
        await this.repository.save(property);
        return { success: true };
    }

    @UseBefore(authMiddleware)
    @Delete('/:id')
    async delete(
        @Req() request: RequestWithUser,
        @Param('id') id: number,
    ): Promise<{ success: boolean }> {
        const { user } = request;
        const property = await this.repository.findOneBy({ id });
        if (!property) throw new NotFoundError('Property not found');
        if (property.owner_id !== user.id) throw new ForbiddenError();

        await this.repository.delete({ id });
        return { success: true };
    }

    @Get('/:id/reviews')
    async getReviews(@Param('id') id: number): Promise<Review[]> {
        const property = await this.repository.findOneBy({ id });
        if (!property) throw new NotFoundError('Property not found');

        const reviewRepo = dataSource.getRepository(Review);
        return await reviewRepo.findBy({ property_id: id });
    }

    @Get('/:id/conversations')
    async getConversations(@Param('id') id: number): Promise<Conversation[]> {
        const property = await this.repository.findOneBy({ id });
        if (!property) throw new NotFoundError('Property not found');

        const convRepo = dataSource.getRepository(Conversation);
        return await convRepo.findBy({ property_id: id });
    }

    @Get('/:id/attributes')
    async getAttributes(@Param('id') id: number): Promise<PropertyAttributes> {
        const property = await this.repository.findOneBy({ id });
        if (!property) throw new NotFoundError('Property not found');

        const attrRepo = dataSource.getRepository(PropertyAttributes);
        const attrs = await attrRepo.findOneBy({ property_id: id });
        if (!attrs) throw new NotFoundError('Attributes not found');
        return attrs;
    }
}

export default PropertiesController;

