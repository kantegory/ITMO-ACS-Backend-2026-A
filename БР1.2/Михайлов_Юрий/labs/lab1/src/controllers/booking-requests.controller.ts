import {
    Body,
    Get,
    NotFoundError,
    Param,
    Post,
    Req,
    UseBefore,
} from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';
import { IsInt, IsString } from 'class-validator';
import { Type } from 'class-transformer';

import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';
import authMiddleware, { RequestWithUser } from '../middlewares/auth.middleware';
import dataSource from '../config/data-source';

import { BookingRequest } from '../models/booking-request.entity';
import { Property } from '../models/property.entity';

class CreateBookingRequestDto {
    @IsInt()
    @Type(() => Number)
    property_id: number;

    @IsString()
    @Type(() => String)
    comments: string;
}

@EntityController({
    baseRoute: '/booking-requests',
    entity: BookingRequest,
})
class BookingRequestsController extends BaseController {

    public repository = dataSource.getRepository(BookingRequest);
    @UseBefore(authMiddleware)
    @Post('')
    @OpenAPI({ security: [{ bearerAuth: [] }] })
    async create(
        @Req() request: RequestWithUser,
        @Body({ type: CreateBookingRequestDto }) body: CreateBookingRequestDto,
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
    @OpenAPI({ security: [{ bearerAuth: [] }] })
    async my(@Req() request: RequestWithUser): Promise<BookingRequest[]> {
        const { user } = request;
        return await this.repository.findBy({ tenant_id: user.id });
    }

    @UseBefore(authMiddleware)
    @Get('/property/:id')
    @OpenAPI({ security: [{ bearerAuth: [] }] })
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

