import {
    BadRequestError,
    Body,
    Get,
    NotFoundError,
    Param,
    Post,
    Req,
    UseBefore,
} from 'routing-controllers';

import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';
import authMiddleware, { RequestWithUser } from '../middlewares/auth.middleware';
import dataSource from '../config/data-source';

import { Property } from '../models/property.entity';
import { PropertyAttributes } from '../models/property-attributes.entity';

@EntityController({
    baseRoute: '/attributes',
    entity: PropertyAttributes,
})
class AttributesController extends BaseController {
    @UseBefore(authMiddleware)
    @Post('')
    async create(
        @Req() request: RequestWithUser,
        @Body()
        body: {
            property_id: number;
            floor: number;
            building_type: string;
            bathrooms_count: number;
            has_washing_machine: boolean;
            view_type: string;
            has_kitchen: boolean;
        },
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
        return attrs;
    }
}

export default AttributesController;

