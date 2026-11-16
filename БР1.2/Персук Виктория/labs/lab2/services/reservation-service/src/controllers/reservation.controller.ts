import { Body, Delete, Get, Param, Patch, Post, HttpCode, UseBefore, Req } from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';

import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';
import { Reservation } from '../models/reservation.entity';
import { Table } from '../models/table.entity';
import { ReservationStatus } from '../common/enums';
import authMiddleware, { RequestWithUser } from '../middlewares/auth.middleware';
import dataSource from '../config/data-source';
import { CreateReservationDto, UpdateReservationDto } from '../dto/reservation.dto';
import { publishReservationCreated, publishReservationCancelled } from '../messaging/publisher';

@EntityController({ baseRoute: '/reservations', entity: Reservation })
class ReservationController extends BaseController {
    @Post('')
    @HttpCode(201)
    @UseBefore(authMiddleware)
    @OpenAPI({ summary: 'Create a reservation', security: [{ bearerAuth: [] }] })
    async create(@Req() request: RequestWithUser, @Body({ type: CreateReservationDto }) body: CreateReservationDto) {
        const { user } = request;

        const tableRepo = dataSource.getRepository(Table);
        const table = await tableRepo.findOneBy({ table_id: body.table_id });
        if (!table) return { message: 'Table not found' };

        if (body.guest_number > table.capacity) {
            return { message: `Guest number exceeds table capacity (${table.capacity})` };
        }

        const requestedTime = new Date(body.reservation_time);
        const twoHoursBefore = new Date(requestedTime.getTime() - 2 * 60 * 60 * 1000);
        const twoHoursAfter = new Date(requestedTime.getTime() + 2 * 60 * 60 * 1000);

        const conflicting = await this.repository
            .createQueryBuilder('reservation')
            .where('reservation.table_id = :tableId', { tableId: body.table_id })
            .andWhere('reservation.status IN (:...statuses)', {
                statuses: [ReservationStatus.Confirmed, ReservationStatus.Pending],
            })
            .andWhere('reservation.reservation_time > :start AND reservation.reservation_time < :end', {
                start: twoHoursBefore,
                end: twoHoursAfter,
            })
            .getOne();

        if (conflicting) return { message: 'Table is already booked for this time' };

        const reservation = this.repository.create({
            ...body,
            reservation_time: requestedTime,
            reservation_date: new Date(body.reservation_date),
            user_id: user.id,
            status: ReservationStatus.Pending,
        });

        const saved = await this.repository.save(reservation) as Reservation;

        await publishReservationCreated({
            reservation_id: saved.reservation_id,
            user_id: user.id,
            table_id: saved.table_id,
            restaurant_id: table.restaurant_id,
            reservation_time: saved.reservation_time.toISOString(),
            guest_number: saved.guest_number,
        });

        return saved;
    }

    @Get('/:id')
    @UseBefore(authMiddleware)
    @OpenAPI({ summary: 'Get a reservation by id', security: [{ bearerAuth: [] }] })
    async getById(@Param('id') id: number, @Req() request: RequestWithUser) {
        const { user } = request;
        const reservation = await this.repository.findOne({
            where: { reservation_id: id },
            relations: ['table'],
        }) as Reservation;

        if (!reservation) return { message: 'Reservation not found' };
        if (reservation.user_id !== user.id) return { message: 'Forbidden' };

        return reservation;
    }

    @Patch('/:id')
    @UseBefore(authMiddleware)
    @OpenAPI({ summary: 'Update a reservation', security: [{ bearerAuth: [] }] })
    async update(@Param('id') id: number, @Req() request: RequestWithUser, @Body({ type: UpdateReservationDto }) body: UpdateReservationDto) {
        const { user } = request;
        const reservation = await this.repository.findOneBy({ reservation_id: id }) as Reservation;
        if (!reservation) return { message: 'Reservation not found' };
        if (reservation.user_id !== user.id) return { message: 'Forbidden' };

        const diffHours = (new Date(reservation.reservation_time).getTime() - Date.now()) / (1000 * 60 * 60);
        if (diffHours <= 3) return { message: 'Cannot modify reservation less than 3 hours before reservation time' };

        if (body.reservation_time) (reservation as any).reservation_time = new Date(body.reservation_time);
        if (body.reservation_date) (reservation as any).reservation_date = new Date(body.reservation_date);
        if (body.guest_number !== undefined) reservation.guest_number = body.guest_number;
        if (body.status) reservation.status = body.status;

        return await this.repository.save(reservation);
    }

    @Delete('/:id')
    @UseBefore(authMiddleware)
    @OpenAPI({ summary: 'Cancel/delete a reservation', security: [{ bearerAuth: [] }] })
    async delete(@Param('id') id: number, @Req() request: RequestWithUser) {
        const { user } = request;
        const reservation = await this.repository.findOneBy({ reservation_id: id }) as Reservation;
        if (!reservation) return { message: 'Reservation not found' };
        if (reservation.user_id !== user.id) return { message: 'Forbidden' };

        const diffHours = (new Date(reservation.reservation_time).getTime() - Date.now()) / (1000 * 60 * 60);
        if (diffHours <= 3) return { message: 'Cannot cancel reservation less than 3 hours before reservation time' };

        reservation.status = ReservationStatus.Cancelled;
        const saved = await this.repository.save(reservation) as Reservation;

        await publishReservationCancelled({
            reservation_id: saved.reservation_id,
            user_id: user.id,
            reason: 'Cancelled by user',
        });

        return saved;
    }
}

export default ReservationController;
