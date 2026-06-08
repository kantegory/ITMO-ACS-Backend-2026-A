import { Get, Post, Body, HttpCode, UseBefore } from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';

import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';

import { Amenity } from '../models/amenity.entity';
import authMiddleware from '../middlewares/auth.middleware';
import { CreateAmenityDto } from '../dto/amenity.dto';

@EntityController({ baseRoute: '/amenities', entity: Amenity })
class AmenityController extends BaseController {
    @Get('')
    @OpenAPI({ summary: 'Справочник удобств' })
    async list() {
        return this.repository.find({ order: { name: 'ASC' } });
    }

    @Post('')
    @HttpCode(201)
    @UseBefore(authMiddleware)
    @OpenAPI({ summary: 'Добавить удобство', security: [{ bearerAuth: [] }] })
    async create(@Body() data: CreateAmenityDto) {
        const amenity = this.repository.create({
            name: data.name,
            icon: data.icon ?? null,
        });
        return this.repository.save(amenity);
    }
}

export default AmenityController;
