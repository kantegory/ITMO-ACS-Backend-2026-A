import {
    Body,
    Get,
    NotFoundError,
    Post,
    Req,
    UseBefore,
} from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';
import { IsInt, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';
import authMiddleware, { RequestWithUser } from '../middlewares/auth.middleware';
import dataSource from '../config/data-source';

import { Payment } from '../models/payment.entity';
import { ObjectLiteral } from "typeorm";

const BOOKING_SERVICE_URL = process.env.BOOKING_SERVICE_URL || 'http://localhost:8002';

class CreatePaymentDto {
    @IsInt()
    @Type(() => Number)
    booking_id: number;

    @IsNumber()
    @Type(() => Number)
    amount: number;
}

@EntityController({
    baseRoute: '/payments',
    entity: Payment,
})
class PaymentsController extends BaseController {
    @UseBefore(authMiddleware)
    @Post('')
    @OpenAPI({ security: [{ bearerAuth: [] }] })
    async create(
        @Req() request: RequestWithUser,
        @Body({ type: CreatePaymentDto }) body: CreatePaymentDto,
    ): Promise<{ id: number }> {
        const { user } = request;

        // Проверяем бронирование через API Booking Service
        const verifyResponse = await fetch(
            `${BOOKING_SERVICE_URL}/api/internal/bookings/verify`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    booking_id: body.booking_id,
                    tenant_id: user.id
                })
            }
        );

        const verification = await verifyResponse.json();

        if (!verification.valid) {
            throw new NotFoundError('Booking not found or access denied');
        }

        const created = this.repository.create({
            booking_id: body.booking_id,
            amount: body.amount,
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

        // Получаем платежи через join с Booking Service (более сложный вариант)
        // Упрощенно: сначала получаем все booking_id пользователя, затем платежи

        const bookingsResponse = await fetch(
            `${BOOKING_SERVICE_URL}/api/internal/users/${user.id}/bookings`,
            { headers: { 'Content-Type': 'application/json' } }
        );

        if (!bookingsResponse.ok) {
            return [];
        }

        const bookings = await bookingsResponse.json();
        const bookingIds = bookings.map((b: any) => b.id);

        if (bookingIds.length === 0) {
            return [];
        }

        // Получаем платежи по этим бронированиям
        return await this.repository
            .createQueryBuilder('p')
            .where('p.booking_id IN (:...bookingIds)', { bookingIds })
            .getMany();
    }
}

export default PaymentsController;
