import {
    BadRequestError,
    Body,
    ForbiddenError,
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

import { Booking } from '../models/booking.entity';
import { Property } from '../models/property.entity';

class CreateBookingDto {
    @IsInt()
    @Type(() => Number)
    property_id: number;

    @IsInt()
    @Type(() => Number)
    tenant_id: number;

    @IsString()
    @Type(() => String)
    start_date: string;

    @IsString()
    @Type(() => String)
    end_date: string;

    @IsString()
    @Type(() => String)
    details: string;
}

@EntityController({
    baseRoute: '/bookings',
    entity: Booking,
})
class BookingsController extends BaseController {

    public repository = dataSource.getRepository(Booking);
    @UseBefore(authMiddleware)
    @Post('')
    @OpenAPI({ security: [{ bearerAuth: [] }] })
    async create(
        @Req() request: RequestWithUser,
        @Body({ type: CreateBookingDto }) body: CreateBookingDto,
    ): Promise<{ id: number }> {
        const { user } = request;
        if (body.tenant_id !== user.id) {
            throw new ForbiddenError();
        }

        const propertyRepo = dataSource.getRepository(Property);
        const property = await propertyRepo.findOneBy({ id: body.property_id });
        if (!property) throw new BadRequestError('Property does not exist');
        if (property.owner_id === user.id) {
            throw new ForbiddenError('Owner cannot book own property');
        }

        const created = this.repository.create({
            ...body,
            status: 'created',
        });
        const saved = await this.repository.save(created);
        return { id: saved.id };
    }

    @UseBefore(authMiddleware)
    @Get('/my')
    @OpenAPI({ security: [{ bearerAuth: [] }] })
    async my(@Req() request: RequestWithUser): Promise<Booking[]> {
        const { user } = request;
        return await this.repository.findBy({ tenant_id: user.id });
    }

    @UseBefore(authMiddleware)
    @Get('/:id')
    @OpenAPI({ security: [{ bearerAuth: [] }] })
    async get(
        @Req() request: RequestWithUser,
        @Param('id') id: number,
    ): Promise<Booking> {
        const { user } = request;
        const booking = await this.repository.findOneBy({ id });
        if (!booking) throw new NotFoundError('Booking not found');

        const propertyRepo = dataSource.getRepository(Property);
        const property = await propertyRepo.findOneBy({
            id: booking.property_id,
        });
        if (!property) throw new NotFoundError('Property not found');

        const canSee = booking.tenant_id === user.id || property.owner_id === user.id;
        if (!canSee) throw new ForbiddenError();

        return booking;
    }
}

export default BookingsController;

