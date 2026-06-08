import { Get, Post, Body, HttpCode, UseBefore } from 'routing-controllers';

import EntityController from '../../../shared/entity-controller';
import BaseController from '../../../shared/base-controller';
import authMiddleware from '../../../shared/auth.middleware';

import dataSource from '../data-source';
import { Amenity } from '../models/amenity.entity';
import { CreateAmenityDto } from '../dto/catalog.dto';

@EntityController({ baseRoute: '/amenities', entity: Amenity, dataSource })
class AmenityController extends BaseController {
    @Get('')
    async list() {
        return this.repository.find({ order: { name: 'ASC' } });
    }

    @Post('')
    @HttpCode(201)
    @UseBefore(authMiddleware)
    async create(@Body() data: CreateAmenityDto) {
        const amenity = this.repository.create({ name: data.name, icon: data.icon ?? null });
        return this.repository.save(amenity);
    }
}

export default AmenityController;
