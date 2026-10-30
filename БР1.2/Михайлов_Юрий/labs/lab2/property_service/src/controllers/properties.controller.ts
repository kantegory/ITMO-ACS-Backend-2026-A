import {
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
import { OpenAPI } from 'routing-controllers-openapi';
import {
    IsArray,
    IsBoolean,
    IsInt,
    IsNumber,
    IsOptional,
    IsString,
    ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';
import authMiddleware, { RequestWithUser } from '../middlewares/auth.middleware';
import dataSource from '../config/data-source';

import { Property } from '../models/property.entity';
import { PropertyLocation } from '../models/property-location.entity';
import { PropertyImage } from '../models/property-image.entity';
// import { Review } from '../models/review.entity';
// import { Conversation } from '../models/conversation.entity';
import { PropertyAttributes } from '../models/property-attributes.entity';

class LocationDto {
    @IsString()
    @Type(() => String)
    address: string;

    @IsString()
    @Type(() => String)
    city: string;

    @IsString()
    @Type(() => String)
    country: string;

    @IsOptional()
    @IsString()
    @Type(() => String)
    metro_station?: string;

    @IsNumber()
    @Type(() => Number)
    latitude: number;

    @IsNumber()
    @Type(() => Number)
    longitude: number;
}


class CreatePropertyAttributesDto {
    @IsInt()
    @Type(() => Number)
    floor: number;

    @IsString()
    @Type(() => String)
    building_type: string;

    @IsInt()
    @Type(() => Number)
    bathrooms_count: number;

    @IsBoolean()
    @Type(() => Boolean)
    has_washing_machine: boolean;

    @IsString()
    @Type(() => String)
    view_type: string;

    @IsBoolean()
    @Type(() => Boolean)
    has_kitchen: boolean;
}

class CreatePropertyImageDto {
    @IsString()
    @Type(() => String)
    url: string;
}

class CreatePropertyDto {
    @IsString()
    @Type(() => String)
    title: string;

    @IsString()
    @Type(() => String)
    description: string;

    @IsNumber()
    @Type(() => Number)
    price_per_month: number;

    @IsNumber()
    @Type(() => Number)
    square: number;

    @IsString()
    @Type(() => String)
    type: string;

    @IsOptional()
    @ValidateNested()
    @Type(() => LocationDto)
    location?: LocationDto;

    @IsOptional()
    @ValidateNested()
    @Type(() => CreatePropertyAttributesDto)
    attributes?: CreatePropertyAttributesDto;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreatePropertyImageDto)
    images?: CreatePropertyImageDto[];
}

class UpdatePropertyDto {
    @IsString()
    @Type(() => String)
    title: string;

    @IsString()
    @Type(() => String)
    description: string;

    @IsNumber()
    @Type(() => Number)
    price_per_month: number;

    @IsNumber()
    @Type(() => Number)
    square: number;

    @IsString()
    @Type(() => String)
    type: string;
}


const ENGAGEMENT_SERVICE_URL = process.env.ENGAGEMENT_SERVICE_URL || 'http://127.0.0.1:8003';

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
              location?: LocationDto;
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

        const images = await imageRepo.findBy({ property_id: id });

        return {
            ...property,
            location: location
                ? {
                      address: location.address,
                      city: location.city,
                      country: location.country,
                      metro_station: location.metro_station || undefined,
                      latitude: location.latitude,
                      longitude: location.longitude,
                  }
                : undefined,
            images: images.map((i) => ({ url: i.url })),
        };
    }

    @UseBefore(authMiddleware)
    @Post('')
    @OpenAPI({ security: [{ bearerAuth: [] }] })
    async create(
        @Req() request: RequestWithUser,
        @Body({ type: CreatePropertyDto }) body: CreatePropertyDto,
    ): Promise<{ id: number }> {
        const { user } = request;
        const propertyRepo = dataSource.getRepository(Property);
        const locationRepo = dataSource.getRepository(PropertyLocation);
        const attributesRepo = dataSource.getRepository(PropertyAttributes);
        const imageRepo = dataSource.getRepository(PropertyImage);

        const created = propertyRepo.create({
            title: body.title,
            description: body.description,
            price_per_month: body.price_per_month,
            square: body.square,
            type: body.type,
            owner_id: user.id,
        });
        const saved = await propertyRepo.save(created);

        if (body.location) {
            const location = locationRepo.create({
                property_id: saved.id,
                ...body.location,
                metro_station: body.location.metro_station ?? null,
            });
            await locationRepo.save(location);
        }

        if (body.attributes) {
            const attributes = attributesRepo.create({
                property_id: saved.id,
                ...body.attributes,
            });
            await attributesRepo.save(attributes);
        }

        if (body.images?.length) {
            const images = body.images.map((image) =>
                imageRepo.create({ property_id: saved.id, url: image.url }),
            );
            await imageRepo.save(images);
        }

        return { id: saved.id };
    }

    @UseBefore(authMiddleware)
    @Put('/:id')
    @OpenAPI({ security: [{ bearerAuth: [] }] })
    async update(
        @Req() request: RequestWithUser,
        @Param('id') id: number,
        @Body({ type: UpdatePropertyDto }) body: UpdatePropertyDto,
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
    @OpenAPI({ security: [{ bearerAuth: [] }] })
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
    async getReviews(@Param('id') id: number) {
        // 1. Проверяем, существует ли property
        const property = await this.repository.findOneBy({ id });
        if (!property) throw new NotFoundError('Property not found');

        // 2. Запрашиваем отзывы из Engagement Service
        try {
            const response = await fetch(
                `${ENGAGEMENT_SERVICE_URL}/api/internal/reviews/property/${id}`,
                { headers: { 'Content-Type': 'application/json' } }
            );

            if (!response.ok) {
                throw new Error('Failed to fetch reviews');
            }

            const reviews = await response.json();
            return reviews;
        } catch (error) {
            console.error('Error fetching reviews:', error);
            return []; // или throw new ServiceUnavailableError()
        }
    }

    @Get('/:id/conversations')
    async getConversations(@Param('id') id: number) {
        // 1. Проверяем, существует ли property
        const property = await this.repository.findOneBy({ id });
        if (!property) throw new NotFoundError('Property not found');

        // 2. Запрашиваем чаты из Engagement Service
        try {
            const response = await fetch(
                `${ENGAGEMENT_SERVICE_URL}/api/internal/conversations/property/${id}`,
                { headers: { 'Content-Type': 'application/json' } }
            );

            if (!response.ok) {
                throw new Error('Failed to fetch conversations');
            }

            const conversations = await response.json();
            return conversations;
        } catch (error) {
            console.error('Error fetching conversations:', error);
            return [];
        }
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

import { JsonController} from 'routing-controllers';

@JsonController('/internal')
export class InternalPropertiesController {

    @Get('/properties/:id')
    @OpenAPI({ deprecated: true })
    async getProperty(@Param('id') id: number) {
        const propertyRepo = dataSource.getRepository(Property);
        const property = await propertyRepo.findOneBy({ id });

        if (!property) {
            throw new NotFoundError('Property not found');
        }

        return {
            id: property.id,
            owner_id: property.owner_id,
            title: property.title,
            price_per_month: property.price_per_month,

        };
    }

    @Get('/properties/:id/exists')
    @OpenAPI({ deprecated: true })
    async checkPropertyExists(@Param('id') id: number) {
        const propertyRepo = dataSource.getRepository(Property);
        const exists = await propertyRepo.existsBy({ id });

        return { exists };
    }
}

export default PropertiesController;

