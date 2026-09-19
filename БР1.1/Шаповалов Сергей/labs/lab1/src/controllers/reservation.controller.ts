import {
    Body,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    UseBefore,
    Req,
    NotFoundError,
    BadRequestError,
    HttpCode,
} from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';
import { IsDateString, IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';
import {
    Reservation,
    ReservationStatus,
} from '../models/reservation.entity';
import authMiddleware, { RequestWithUser } from '../middlewares/auth.middleware';
import { serializeReservation } from '../utils/serializers';

class ReservationDto {
    @IsOptional()
    @IsInt()
    restaurant?: number;

    @IsDateString()
    start_time: string;

    @IsInt()
    @Min(1)
    guest_count: number;

    @IsOptional()
    @IsEnum(ReservationStatus)
    status?: ReservationStatus;
}

class UpdateStatusDto {
    @IsEnum(ReservationStatus)
    status: ReservationStatus;
}

@EntityController({
    baseRoute: '/reservations',
    entity: Reservation,
})
class ReservationController extends BaseController {
    @Get('')
    @UseBefore(authMiddleware)
    @OpenAPI({ summary: 'Список бронирований', tags: ['Бронирования'] })
    async getAll() {
        const reservations = await this.repository.find({
            relations: ['restaurant', 'user'],
            order: { createdAt: 'DESC' },
        });
        return reservations.map(serializeReservation);
    }

    @Get('/my')
    @UseBefore(authMiddleware)
    @OpenAPI({ summary: 'Мои бронирования', tags: ['Бронирования'] })
    async my(@Req() request: RequestWithUser) {
        const reservations = await this.repository.find({
            where: { userId: request.user.id },
            relations: ['restaurant', 'user'],
            order: { createdAt: 'DESC' },
        });
        return reservations.map(serializeReservation);
    }

    @Get('/:id')
    @UseBefore(authMiddleware)
    @OpenAPI({ summary: 'Бронирование', tags: ['Бронирования'] })
    async getById(@Param('id') id: number) {
        const reservation = await this.repository.findOne({
            where: { id },
            relations: ['restaurant', 'user'],
        });
        if (!reservation) {
            throw new NotFoundError('Reservation not found');
        }
        return serializeReservation(reservation);
    }

    @Post('')
    @UseBefore(authMiddleware)
    @OpenAPI({ summary: 'Создать бронирование', tags: ['Бронирования'] })
    async create(
        @Req() request: RequestWithUser,
        @Body({ type: ReservationDto }) data: ReservationDto,
    ) {
        const reservation = this.repository.create({
            userId: request.user.id,
            restaurantId: data.restaurant,
            startTime: new Date(data.start_time),
            guestCount: data.guest_count,
            status: data.status || ReservationStatus.PENDING,
        });

        const saved = await this.repository.save(reservation);
        const full = await this.repository.findOne({
            where: { id: saved.id },
            relations: ['restaurant', 'user'],
        });

        return serializeReservation(full);
    }

    @Patch('/:id')
    @UseBefore(authMiddleware)
    @OpenAPI({ summary: 'Обновить бронирование', tags: ['Бронирования'] })
    async update(
        @Param('id') id: number,
        @Body({ type: ReservationDto }) data: ReservationDto,
    ) {
        const reservation = await this.repository.findOne({
            where: { id },
            relations: ['restaurant', 'user'],
        });
        if (!reservation) {
            throw new NotFoundError('Reservation not found');
        }

        if (data.start_time !== undefined) {
            reservation.startTime = new Date(data.start_time);
        }
        if (data.guest_count !== undefined) {
            reservation.guestCount = data.guest_count;
        }
        if (data.restaurant !== undefined) {
            reservation.restaurantId = data.restaurant;
        }

        await this.repository.save(reservation);
        return serializeReservation(reservation);
    }

    @Patch('/:id/status')
    @UseBefore(authMiddleware)
    @OpenAPI({ summary: 'Изменить статус', tags: ['Бронирования'] })
    async updateStatus(
        @Param('id') id: number,
        @Body({ type: UpdateStatusDto }) data: UpdateStatusDto,
    ) {
        if (![ReservationStatus.CONFIRMED, ReservationStatus.CANCELLED].includes(data.status)) {
            throw new BadRequestError('Invalid status');
        }

        const reservation = await this.repository.findOne({
            where: { id },
            relations: ['restaurant', 'user'],
        });
        if (!reservation) {
            throw new NotFoundError('Reservation not found');
        }

        reservation.status = data.status;
        await this.repository.save(reservation);
        return serializeReservation(reservation);
    }

    @Delete('/:id')
    @UseBefore(authMiddleware)
    @HttpCode(204)
    @OpenAPI({ summary: 'Удалить бронирование', tags: ['Бронирования'] })
    async delete(@Param('id') id: number) {
        const reservation = await this.repository.findOneBy({ id });
        if (!reservation) {
            throw new NotFoundError('Reservation not found');
        }
        await this.repository.remove(reservation);
    }
}

export default ReservationController;
