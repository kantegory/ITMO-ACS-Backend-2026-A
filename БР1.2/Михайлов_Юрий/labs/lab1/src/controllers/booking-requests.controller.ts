import {
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

import { BookingRequest } from '../models/booking-request.entity';
import { Property } from '../models/property.entity';

@EntityController({
    baseRoute: '/booking-requests',
    entity: BookingRequest,
})
class BookingRequestsController extends BaseController {
    @UseBefore(authMiddleware)
    @Post('')
    async create(
        @Req() request: RequestWithUser,
        @Body() body: { property_id: number; comments: string },
    ): Promise<{ id: number }> {
        const { user } = request;

        const propertyRepo = dataSource.getRepository(Property);
        const property = await propertyRepo.findOneBy({ id: body.property_id });
        if (!property) throw new NotFoundError('Property not found');

        const created = this.repository.create({
            property_id: body.property_id,
            comments: body.comments,
            tenant_id: user.id,
        });
        const saved = await this.repository.save(created);
        return { id: saved.id };
    }

    @UseBefore(authMiddleware)
    @Get('/my')
    async my(@Req() request: RequestWithUser): Promise<BookingRequest[]> {
        const { user } = request;
        return await this.repository.findBy({ tenant_id: user.id });
    }

    @UseBefore(authMiddleware)
    @Get('/property/:id')
    async byProperty(
        @Req() request: RequestWithUser,
        @Param('id') id: number,
    ): Promise<BookingRequest[]> {
        const { user } = request;

        const propertyRepo = dataSource.getRepository(Property);
        const property = await propertyRepo.findOneBy({ id });
        if (!property) throw new NotFoundError('Property not found');

        // минимальная авторизация: только владелец может смотреть заявки по своему объекту
        if (property.owner_id !== user.id) {
            return [];
        }

        return await this.repository.findBy({ property_id: id });
    }
}

export default BookingRequestsController;

