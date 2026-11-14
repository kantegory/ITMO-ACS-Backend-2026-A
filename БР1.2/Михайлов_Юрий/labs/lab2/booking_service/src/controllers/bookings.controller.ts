// booking-service/controllers/bookings.controller.ts
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
import { IsDateString, IsInt, IsString } from 'class-validator';
import { Type } from 'class-transformer';

import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';
import authMiddleware, { RequestWithUser } from '../middlewares/auth.middleware';
import dataSource from '../config/data-source';

import { Booking } from '../models/booking.entity';
import { ObjectLiteral } from "typeorm";

import { JSONSchema } from 'class-validator-jsonschema';

const PROPERTY_SERVICE_URL = process.env.PROPERTY_SERVICE_URL || 'http://localhost:8001';

class CreateBookingDto {
    @IsInt()
    @Type(() => Number)
    property_id: number;

    @IsDateString()
    @JSONSchema({ format: 'date' })
    start_date: string;

    @IsDateString()
    @JSONSchema({ format: 'date' })
    end_date: string;

    @IsString()
    details: string;
}

@EntityController({
    baseRoute: '/bookings',
    entity: Booking,
})
class BookingsController extends BaseController {

    @UseBefore(authMiddleware)
    @Post('')
    @OpenAPI({ security: [{ bearerAuth: [] }] })
    async create(
        @Req() request: RequestWithUser,
        @Body({ type: CreateBookingDto }) body: CreateBookingDto,
    ): Promise<{ id: number }> {
        const { user } = request;

        // Получаем property, чтобы проверить владельца
        const propertyResponse = await fetch(
            `${PROPERTY_SERVICE_URL}/api/internal/properties/${body.property_id}`,
            { headers: { 'Content-Type': 'application/json' } }
        );

        if (!propertyResponse.ok) {
            throw new BadRequestError('Property does not exist');
        }

        const property = await propertyResponse.json();

        // Проверяем, что владелец не бронирует сам у себя
        if (property.owner_id === user.id) {
            throw new ForbiddenError('Owner cannot book own property');
        }

        const created = this.repository.create({
            property_id: body.property_id,
            tenant_id: user.id, // берем из авторизации
            start_date: body.start_date,
            end_date: body.end_date,
            details: body.details,
            status: 'created',
        });
        const saved = await this.repository.save(created);
        return { id: saved.id };
    }

    @UseBefore(authMiddleware)
    @Get('/my')
    @OpenAPI({ security: [{ bearerAuth: [] }] })
    async my(@Req() request: RequestWithUser): Promise<ObjectLiteral[]> {
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

        // Получаем property, чтобы проверить права
        const propertyResponse = await fetch(
            `${PROPERTY_SERVICE_URL}/api/internal/properties/${booking.property_id}`,
            { headers: { 'Content-Type': 'application/json' } }
        );

        if (!propertyResponse.ok) {
            throw new NotFoundError('Property not found');
        }

        const property = await propertyResponse.json();

        const canSee = booking.tenant_id === user.id || property.owner_id === user.id;
        if (!canSee) throw new ForbiddenError();

        return booking as Booking;
    }
}

export default BookingsController;
