import {
    BadRequestError,
    Body,
    Get,
    NotFoundError,
    Param,
    Post,
    Put,
    Req,
    UseBefore,
} from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';
import { IsBoolean, IsInt, IsString } from 'class-validator';
import { Type } from 'class-transformer';

import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';
import authMiddleware, { RequestWithUser } from '../middlewares/auth.middleware';
import dataSource from '../config/data-source';

import { Property } from '../models/property.entity';
import { PropertyAttributes } from '../models/property-attributes.entity';

class CreateAttributesDto {
    @IsInt()
    @Type(() => Number)
    property_id: number;

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

@EntityController({
    baseRoute: '/attributes',
    entity: PropertyAttributes,
})
class AttributesController extends BaseController {
    @UseBefore(authMiddleware)
    @Post('')
    @OpenAPI({ security: [{ bearerAuth: [] }] })
    async create(
        @Req() request: RequestWithUser,
        @Body({ type: CreateAttributesDto }) body: CreateAttributesDto,
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
            throw new BadRequestError('Attributes already exist for property');
        }

        const created = this.repository.create(body);
        const saved = await this.repository.save(created);
        return { id: saved.id };
    }

    @Get('/:id')
    async get(@Param('id') id: number): Promise<PropertyAttributes> {
        const attrs = await this.repository.findOneBy({ id });
        if (!attrs) throw new NotFoundError('Attributes not found');
        return attrs as PropertyAttributes;
    }

    @UseBefore(authMiddleware)
    @Put('/:id')
    @OpenAPI({ security: [{ bearerAuth: [] }] })
    async update(
        @Req() request: RequestWithUser,
        @Param('id') id: number,
        @Body({ type: CreateAttributesDto }) body: CreateAttributesDto,
    ): Promise<{ success: boolean }> {
        const { user } = request;
        const attrs = await this.repository.findOneBy({ id });
        if (!attrs) throw new NotFoundError('Attributes not found');

        const propertyRepo = dataSource.getRepository(Property);
        const property = await propertyRepo.findOneBy({ id: attrs.property_id });
        if (!property) throw new NotFoundError('Property not found');
        if (property.owner_id !== user.id) throw new BadRequestError('Not owner');

        Object.assign(attrs, body, { property_id: attrs.property_id });
        await this.repository.save(attrs);
        return { success: true };
    }
}

export default AttributesController;

