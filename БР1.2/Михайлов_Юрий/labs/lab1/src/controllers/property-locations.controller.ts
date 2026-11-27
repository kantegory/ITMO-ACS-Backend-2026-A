import {
    BadRequestError,
    Body,
    Delete,
    Get,
    NotFoundError,
    Param,
    Post,
    Put,
    Req,
    UseBefore,
} from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';
import { IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';
import authMiddleware, { RequestWithUser } from '../middlewares/auth.middleware';
import dataSource from '../config/data-source';

import { PropertyLocation } from '../models/property-location.entity';
import { Property } from '../models/property.entity';
import {Payment} from "../models/payment.entity";
import {ObjectLiteral} from "typeorm";

class LocationDto {
    @IsNumber()
    @Type(() => Number)
    property_id: number;

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

@EntityController({
    baseRoute: '/property-locations',
    entity: PropertyLocation,
})
class PropertyLocationsController extends BaseController {

    @Get('')
    async list(): Promise<ObjectLiteral[]> {
        return await this.repository.find();
    }

    @Get('/:id')
    async get(@Param('id') id: number): Promise<PropertyLocation> {
        const location = await this.repository.findOneBy({ id });
        if (!location) throw new NotFoundError('Location not found');
        return location as PropertyLocation;
    }

    @UseBefore(authMiddleware)
    @Post('')
    @OpenAPI({ security: [{ bearerAuth: [] }] })
    async create(
        @Req() request: RequestWithUser,
        @Body({ type: LocationDto }) body: LocationDto,
    ): Promise<{ id: number }> {
        const { user } = request;
        const propertyRepo = dataSource.getRepository(Property);
        const property = await propertyRepo.findOneBy({ id: body.property_id });
        if (!property) throw new NotFoundError('Property not found');
        if (property.owner_id !== user.id) throw new BadRequestError('Not owner');

        const existing = await this.repository.findOneBy({
            property_id: body.property_id,
        });
        if (existing) {
            throw new BadRequestError('Location already exists for property');
        }

        const created = this.repository.create({
            ...body,
            metro_station: body.metro_station ?? null,
        });
        const saved = await this.repository.save(created);
        return { id: saved.id };
    }

    @UseBefore(authMiddleware)
    @Put('/:id')
    @OpenAPI({ security: [{ bearerAuth: [] }] })
    async update(
        @Req() request: RequestWithUser,
        @Param('id') id: number,
        @Body({ type: LocationDto }) body: LocationDto,
    ): Promise<{ success: boolean }> {
        const { user } = request;
        const location = await this.repository.findOneBy({ id });
        if (!location) throw new NotFoundError('Location not found');

        const propertyRepo = dataSource.getRepository(Property);
        const property = await propertyRepo.findOneBy({ id: location.property_id });
        if (!property) throw new NotFoundError('Property not found');
        if (property.owner_id !== user.id) throw new BadRequestError('Not owner');

        Object.assign(location, body, {
            property_id: location.property_id,
            metro_station: body.metro_station ?? null,
        });
        await this.repository.save(location);

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
        const location = await this.repository.findOneBy({ id });
        if (!location) throw new NotFoundError('Location not found');

        const propertyRepo = dataSource.getRepository(Property);
        const property = await propertyRepo.findOneBy({ id: location.property_id });
        if (!property) throw new NotFoundError('Property not found');
        if (property.owner_id !== user.id) throw new BadRequestError('Not owner');

        await this.repository.delete({ id });
        return { success: true };
    }
}

export default PropertyLocationsController;

