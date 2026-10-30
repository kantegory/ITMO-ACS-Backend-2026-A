import {
    Body,
    Get,
    HttpCode,
    JsonController,
    Param,
    Patch,
    Post,
    QueryParams,
    Req,
    UseBefore,
} from 'routing-controllers';
import { Type } from 'class-transformer';
import { OpenAPI } from 'routing-controllers-openapi';
import {
    IsEnum,
    IsInt,
    IsOptional,
    IsString,
    Matches,
    Min,
} from 'class-validator';
import dataSource from '../config/data-source';
import { ApiError } from '../common/api-error';
import { ReservationStatus, UserRole } from '../common/enums';
import { buildPaginationMeta, normalizePagination } from '../common/pagination';
import { serializeReservation } from '../common/serializers';
import { DATE_REGEX, TIME_REGEX } from '../common/validation';
import authMiddleware, { RequestWithUser } from '../middlewares/auth.middleware';
import { Reservation } from '../models/reservation.entity';
import { RestaurantTable } from '../models/restaurant-table.entity';
import { Restaurant } from '../models/restaurant.entity';

class ReservationListQueryDto {
    @IsOptional()
    @IsEnum(ReservationStatus)
    status?: ReservationStatus;

    @IsOptional()
    @IsString()
    @Matches(DATE_REGEX)
    fromDate?: string;

    @IsOptional()
    @IsString()
    @Matches(DATE_REGEX)
    toDate?: string;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    limit?: number;
}

class CreateReservationDto {
    @IsString()
    restaurantId: string;

    @IsString()
    tableId: string;

    @IsString()
    @Matches(DATE_REGEX)
    reservationDate: string;

    @IsString()
    @Matches(TIME_REGEX)
    reservationTime: string;

    @Type(() => Number)
    @IsInt()
    @Min(1)
    guestsCount: number;

    @IsOptional()
    @IsString()
    comment?: string;
}

class UpdateReservationDto {
    @IsOptional()
    @IsString()
    tableId?: string;

    @IsOptional()
    @IsString()
    @Matches(DATE_REGEX)
    reservationDate?: string;

    @IsOptional()
    @IsString()
    @Matches(TIME_REGEX)
    reservationTime?: string;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    guestsCount?: number;

    @IsOptional()
    @IsString()
    comment?: string;
}

class CancelReservationDto {
    @IsOptional()
    @IsString()
    reason?: string;
}

@JsonController('/reservations')
@UseBefore(authMiddleware)
@OpenAPI({
    security: [{ bearerAuth: [] }],
})
class ReservationsController {
    private reservationRepository = dataSource.getRepository(Reservation);
    private restaurantRepository = dataSource.getRepository(Restaurant);
    private tableRepository = dataSource.getRepository(RestaurantTable);

    private reservationRelations = {
        user: true,
        restaurant: {
            location: true,
        },
        table: true,
    } as const;

    private canAccessReservation(reservation: Reservation, request: RequestWithUser) {
        return (
            reservation.user.id === request.user?.id ||
            request.user?.role === UserRole.ADMIN
        );
    }

    private async getReservationOrFail(reservationId: string) {
        const reservation = await this.reservationRepository.findOne({
            where: {
                id: reservationId,
            },
            relations: this.reservationRelations,
        });

        if (!reservation) {
            throw new ApiError(404, 'RESERVATION_NOT_FOUND', 'Reservation is not found');
        }

        return reservation;
    }

    private async getRestaurantAndTableOrFail(
        restaurantId: string,
        tableId: string,
        guestsCount: number,
    ) {
        const restaurant = await this.restaurantRepository.findOneBy({
            id: restaurantId,
            isPublished: true,
        });
        if (!restaurant) {
            throw new ApiError(404, 'RESTAURANT_NOT_FOUND', 'Restaurant is not found');
        }

        const table = await this.tableRepository.findOne({
            where: {
                id: tableId,
                restaurant: {
                    id: restaurantId,
                },
            },
            relations: {
                restaurant: true,
            },
        });

        if (!table) {
            throw new ApiError(404, 'TABLE_NOT_FOUND', 'Table is not found');
        }
        if (!table.isActive) {
            throw new ApiError(409, 'TABLE_INACTIVE', 'Table is inactive');
        }
        if (table.capacity < guestsCount) {
            throw new ApiError(
                409,
                'TABLE_CAPACITY_EXCEEDED',
                'Guests count exceeds table capacity',
            );
        }

        return { restaurant, table };
    }

    private async ensureTableIsFree(
        tableId: string,
        reservationDate: string,
        reservationTime: string,
        excludedReservationId?: string,
    ) {
        const conflictingReservation = await this.reservationRepository.findOne({
            where: {
                table: {
                    id: tableId,
                },
                reservationDate,
                reservationTime,
            },
            relations: {
                table: true,
            },
        });

        if (
            conflictingReservation &&
            conflictingReservation.id !== excludedReservationId &&
            [
                ReservationStatus.PENDING,
                ReservationStatus.CONFIRMED,
                ReservationStatus.COMPLETED,
            ].includes(conflictingReservation.status)
        ) {
            throw new ApiError(
                409,
                'TABLE_ALREADY_BOOKED',
                'Table is already booked for the selected time',
            );
        }
    }

    @Get()
    async list(
        @Req() request: RequestWithUser,
        @QueryParams() query: ReservationListQueryDto,
    ) {
        const { page, limit } = normalizePagination(query.page, query.limit);

        const reservations = await this.reservationRepository.find({
            where:
                request.user?.role === UserRole.ADMIN
                    ? {}
                    : {
                          user: {
                              id: request.user?.id,
                          },
                      },
            relations: this.reservationRelations,
            order: {
                createdAt: 'DESC',
            },
        });

        const filteredReservations = reservations.filter((reservation) => {
            if (query.status && reservation.status !== query.status) {
                return false;
            }
            if (query.fromDate && reservation.reservationDate < query.fromDate) {
                return false;
            }
            if (query.toDate && reservation.reservationDate > query.toDate) {
                return false;
            }

            return true;
        });

        const paginated = filteredReservations.slice(
            (page - 1) * limit,
            (page - 1) * limit + limit,
        );

        return {
            data: paginated.map(serializeReservation),
            meta: buildPaginationMeta(page, limit, filteredReservations.length),
        };
    }

    @Post()
    @HttpCode(201)
    async create(
        @Req() request: RequestWithUser,
        @Body() body: CreateReservationDto,
    ) {
        const { restaurant, table } = await this.getRestaurantAndTableOrFail(
            body.restaurantId,
            body.tableId,
            body.guestsCount,
        );

        await this.ensureTableIsFree(
            table.id,
            body.reservationDate,
            body.reservationTime,
        );

        const reservation = this.reservationRepository.create({
            user: request.user,
            restaurant,
            table,
            reservationDate: body.reservationDate,
            reservationTime: body.reservationTime,
            guestsCount: body.guestsCount,
            comment: body.comment,
            status: ReservationStatus.PENDING,
        });

        const createdReservation = await this.reservationRepository.save(reservation);
        const reservationWithRelations = await this.getReservationOrFail(createdReservation.id);

        return {
            data: serializeReservation(reservationWithRelations),
        };
    }

    @Get('/:reservationId')
    async getById(
        @Param('reservationId') reservationId: string,
        @Req() request: RequestWithUser,
    ) {
        const reservation = await this.getReservationOrFail(reservationId);

        if (!this.canAccessReservation(reservation, request)) {
            throw new ApiError(403, 'FORBIDDEN', 'You cannot access this reservation');
        }

        return {
            data: serializeReservation(reservation),
        };
    }

    @Patch('/:reservationId')
    async update(
        @Param('reservationId') reservationId: string,
        @Req() request: RequestWithUser,
        @Body() body: UpdateReservationDto,
    ) {
        const reservation = await this.getReservationOrFail(reservationId);

        if (!this.canAccessReservation(reservation, request)) {
            throw new ApiError(403, 'FORBIDDEN', 'You cannot update this reservation');
        }

        if (
            [ReservationStatus.CANCELLED, ReservationStatus.COMPLETED].includes(
                reservation.status,
            )
        ) {
            throw new ApiError(
                409,
                'RESERVATION_LOCKED',
                'Cancelled or completed reservations cannot be updated',
            );
        }

        const nextRestaurantId = reservation.restaurant.id;
        const nextTableId = body.tableId || reservation.table.id;
        const nextDate = body.reservationDate || reservation.reservationDate;
        const nextTime = body.reservationTime || reservation.reservationTime;
        const nextGuestsCount = body.guestsCount || reservation.guestsCount;

        const { table } = await this.getRestaurantAndTableOrFail(
            nextRestaurantId,
            nextTableId,
            nextGuestsCount,
        );

        await this.ensureTableIsFree(
            table.id,
            nextDate,
            nextTime,
            reservation.id,
        );

        reservation.table = table;
        reservation.reservationDate = nextDate;
        reservation.reservationTime = nextTime;
        reservation.guestsCount = nextGuestsCount;

        if (body.comment !== undefined) {
            reservation.comment = body.comment;
        }

        const updatedReservation = await this.reservationRepository.save(reservation);

        return {
            data: serializeReservation(updatedReservation),
        };
    }

    @Post('/:reservationId/cancel')
    async cancel(
        @Param('reservationId') reservationId: string,
        @Req() request: RequestWithUser,
        @Body() body: CancelReservationDto,
    ) {
        const reservation = await this.getReservationOrFail(reservationId);

        if (!this.canAccessReservation(reservation, request)) {
            throw new ApiError(403, 'FORBIDDEN', 'You cannot cancel this reservation');
        }

        if (reservation.status === ReservationStatus.CANCELLED) {
            throw new ApiError(
                409,
                'RESERVATION_ALREADY_CANCELLED',
                'Reservation is already cancelled',
            );
        }

        if (reservation.status === ReservationStatus.COMPLETED) {
            throw new ApiError(
                409,
                'RESERVATION_COMPLETED',
                'Completed reservation cannot be cancelled',
            );
        }

        reservation.status = ReservationStatus.CANCELLED;
        reservation.cancelReason = body.reason;

        const cancelledReservation = await this.reservationRepository.save(reservation);

        return {
            data: serializeReservation(cancelledReservation),
        };
    }
}

export default ReservationsController;
