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
import { ObjectLiteral } from "typeorm";
import {publishEvent} from "../rabbitmq/publisher";

const PROPERTY_SERVICE_URL = process.env.PROPERTY_SERVICE_URL || 'http://localhost:8001';

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

    @UseBefore(authMiddleware)
    @Post('')
    @OpenAPI({ security: [{ bearerAuth: [] }] })
    async create(
        @Req() request: RequestWithUser,
        @Body({ type: CreateBookingRequestDto }) body: CreateBookingRequestDto,
    ): Promise<{ id: number }> {
        const { user } = request;

        // Проверяем существование property через API
        const propertyResponse = await fetch(
            `${PROPERTY_SERVICE_URL}/api/internal/properties/${body.property_id}/exists`,
            { headers: { 'Content-Type': 'application/json' } }
        );

        if (!propertyResponse.ok) {
            throw new NotFoundError('Property not found');
        }

        const { exists } = await propertyResponse.json();
        if (!exists) {
            throw new NotFoundError('Property not found');
        }

        // Получаем property, чтобы узнать owner_id
        const propertyData = await fetch(
            `${PROPERTY_SERVICE_URL}/api/internal/properties/${body.property_id}`,
            { headers: { 'Content-Type': 'application/json' } }
        );
        const property = await propertyData.json();

        const created = this.repository.create({
            property_id: body.property_id,
            comments: body.comments,
            tenant_id: user.id,
        });
        const saved = await this.repository.save(created);

        // Отправляем событие для создания чата
        await publishEvent('booking_request.created', {
            bookingRequestId: saved.id,
            propertyId: body.property_id,
            tenantId: user.id,
            ownerId: property.owner_id,
            comments: body.comments
        });

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
    @Get('/property/:id')
    @OpenAPI({ security: [{ bearerAuth: [] }] })
    async byProperty(
        @Req() request: RequestWithUser,
        @Param('id') id: number,
    ): Promise<ObjectLiteral[]> {
        const { user } = request;

        // Получаем property, чтобы проверить owner_id
        const propertyResponse = await fetch(
            `${PROPERTY_SERVICE_URL}/api/internal/properties/${id}`,
            { headers: { 'Content-Type': 'application/json' } }
        );

        if (!propertyResponse.ok) {
            throw new NotFoundError('Property not found');
        }

        const property = await propertyResponse.json();

        // минимальная авторизация: только владелец может смотреть заявки по своему объекту
        if (property.owner_id !== user.id) {
            return [];
        }

        return await this.repository.findBy({ property_id: id });
    }
}

export default BookingRequestsController;
