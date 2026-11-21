import 'reflect-metadata';
import { asyncHandler, createServiceApp, errorHandler } from '../../common/service-app';
import { ApiError, conflict, forbidden, notFound } from '../../common/api-error';
import { authContextMiddleware, RequestWithAuth, requireRole } from '../../common/auth-context';
import { ReservationStatus, UserRole } from '../../common/enums';
import { serviceRequest } from '../../common/http-client';
import { buildPaginationMeta, normalizePagination } from '../../common/pagination';
import { getParam } from '../../common/request-params';
import { SETTINGS } from '../../common/settings';
import { reservationDataSource } from './data-source';
import { Reservation, RestaurantTable } from './entities';
import { serializeReservation, serializeTable } from './serializers';

const app = createServiceApp('reservation-service');
const tables = () => reservationDataSource.getRepository(RestaurantTable);
const reservations = () => reservationDataSource.getRepository(Reservation);

const activeReservationStatuses = [
    ReservationStatus.PENDING,
    ReservationStatus.CONFIRMED,
    ReservationStatus.COMPLETED,
];

const ensureRestaurantExists = async (
    restaurantId: string,
    requestId?: string,
    requirePublished = true,
) => {
    await serviceRequest(
        SETTINGS.CATALOG_SERVICE_URL,
        `/internal/restaurants/${restaurantId}/summary?requirePublished=${requirePublished}`,
        { requestId },
    );
};

const getTableOrFail = async (tableId: string, restaurantId?: string) => {
    const table = await tables().findOneBy({
        id: tableId,
        ...(restaurantId ? { restaurantId } : {}),
    });
    if (!table) {
        throw notFound('TABLE_NOT_FOUND', 'Table is not found');
    }
    return table;
};

const getReservationOrFail = async (reservationId: string) => {
    const reservation = await reservations().findOne({
        where: { id: reservationId },
        relations: { table: true },
    });
    if (!reservation) {
        throw notFound('RESERVATION_NOT_FOUND', 'Reservation is not found');
    }
    return reservation;
};

const ensureTableCanBeBooked = async (
    table: RestaurantTable,
    guestsCount: number,
    reservationDate: string,
    reservationTime: string,
    excludedReservationId?: string,
) => {
    if (!table.isActive) {
        throw conflict('TABLE_INACTIVE', 'Table is inactive');
    }
    if (table.capacity < guestsCount) {
        throw conflict('TABLE_CAPACITY_EXCEEDED', 'Guests count exceeds table capacity');
    }

    const conflicts = await reservations().find({
        where: {
            table: { id: table.id },
            reservationDate,
            reservationTime,
        },
        relations: { table: true },
    });

    const busy = conflicts.some((reservation) =>
        reservation.id !== excludedReservationId &&
        activeReservationStatuses.includes(reservation.status),
    );

    if (busy) {
        throw conflict('TABLE_ALREADY_BOOKED', 'Table is already booked for the selected time');
    }
};

const canAccessReservation = (reservation: Reservation, request: RequestWithAuth) =>
    request.auth?.role === UserRole.ADMIN || reservation.userId === request.auth?.userId;

app.get('/restaurants/:restaurantId/tables', asyncHandler(async (request, response) => {
    const restaurantId = getParam(request.params.restaurantId, 'restaurantId');
    const restaurantTables = await tables().find({
        where: { restaurantId },
        order: { tableNumber: 'ASC' },
    });
    response.send({
        restaurantId,
        data: restaurantTables.map(serializeTable),
    });
}));

app.get('/restaurants/:restaurantId/tables/available', asyncHandler(async (request, response) => {
    const restaurantId = getParam(request.params.restaurantId, 'restaurantId');
    const reservationDate = request.query.reservationDate as string;
    const reservationTime = request.query.reservationTime as string;
    const guestsCount = Number(request.query.guestsCount);
    const restaurantTables = await tables().find({ where: { restaurantId, isActive: true } });
    const available = [];

    for (const table of restaurantTables.filter((table) => table.capacity >= guestsCount)) {
        const conflicts = await reservations().find({
            where: { table: { id: table.id }, reservationDate, reservationTime },
            relations: { table: true },
        });
        if (!conflicts.some((reservation) => activeReservationStatuses.includes(reservation.status))) {
            available.push(table);
        }
    }

    response.send({
        restaurantId,
        reservationDate,
        reservationTime,
        guestsCount,
        data: available.map((table) => ({
            id: table.id,
            tableNumber: table.tableNumber,
            capacity: table.capacity,
        })),
    });
}));

app.post('/admin/restaurants/:restaurantId/tables', authContextMiddleware, requireRole(UserRole.ADMIN), asyncHandler(async (request, response) => {
    const restaurantId = getParam(request.params.restaurantId, 'restaurantId');
    await ensureRestaurantExists(restaurantId, (request as any).requestId, false);
    const body = request.body || {};
    const created = await tables().save(tables().create({
        restaurantId,
        tableNumber: body.tableNumber,
        capacity: Number(body.capacity),
        isActive: body.isActive ?? true,
    }));
    response.status(201).send({ data: serializeTable(created) });
}));

app.patch('/admin/tables/:tableId', authContextMiddleware, requireRole(UserRole.ADMIN), asyncHandler(async (request, response) => {
    const table = await getTableOrFail(getParam(request.params.tableId, 'tableId'));
    const body = request.body || {};
    Object.assign(table, {
        tableNumber: body.tableNumber ?? table.tableNumber,
        capacity: body.capacity !== undefined ? Number(body.capacity) : table.capacity,
        isActive: body.isActive ?? table.isActive,
    });
    response.send({ data: serializeTable(await tables().save(table)) });
}));

app.get('/reservations', authContextMiddleware, asyncHandler(async (request: RequestWithAuth, response) => {
    const { page, limit } = normalizePagination(request.query.page, request.query.limit);
    const allReservations = await reservations().find({
        where: request.auth?.role === UserRole.ADMIN ? {} : { userId: request.auth?.userId },
        relations: { table: true },
        order: { createdAt: 'DESC' },
    });

    const filtered = allReservations.filter((reservation) => {
        if (request.query.status && reservation.status !== request.query.status) return false;
        if (request.query.fromDate && reservation.reservationDate < request.query.fromDate) return false;
        if (request.query.toDate && reservation.reservationDate > request.query.toDate) return false;
        return true;
    });

    const paginated = filtered.slice((page - 1) * limit, (page - 1) * limit + limit);
    response.send({
        data: await Promise.all(paginated.map((reservation) => serializeReservation(reservation, (request as any).requestId))),
        meta: buildPaginationMeta(page, limit, filtered.length),
    });
}));

app.post('/reservations', authContextMiddleware, asyncHandler(async (request: RequestWithAuth, response) => {
    const body = request.body || {};
    await ensureRestaurantExists(body.restaurantId, (request as any).requestId);
    const table = await getTableOrFail(body.tableId, body.restaurantId);
    await ensureTableCanBeBooked(table, Number(body.guestsCount), body.reservationDate, body.reservationTime);

    const created = await reservations().save(reservations().create({
        userId: request.auth?.userId,
        restaurantId: body.restaurantId,
        table,
        reservationDate: body.reservationDate,
        reservationTime: body.reservationTime,
        guestsCount: Number(body.guestsCount),
        comment: body.comment,
        status: ReservationStatus.PENDING,
    }));

    response.status(201).send({ data: await serializeReservation(await getReservationOrFail(created.id), (request as any).requestId) });
}));

app.get('/reservations/:reservationId', authContextMiddleware, asyncHandler(async (request: RequestWithAuth, response) => {
    const reservation = await getReservationOrFail(getParam(request.params.reservationId, 'reservationId'));
    if (!canAccessReservation(reservation, request)) {
        throw forbidden('You cannot access this reservation');
    }
    response.send({ data: await serializeReservation(reservation, (request as any).requestId) });
}));

app.patch('/reservations/:reservationId', authContextMiddleware, asyncHandler(async (request: RequestWithAuth, response) => {
    const reservation = await getReservationOrFail(getParam(request.params.reservationId, 'reservationId'));
    if (!canAccessReservation(reservation, request)) {
        throw forbidden('You cannot update this reservation');
    }
    if ([ReservationStatus.CANCELLED, ReservationStatus.COMPLETED].includes(reservation.status)) {
        throw conflict('RESERVATION_LOCKED', 'Cancelled or completed reservations cannot be updated');
    }

    const body = request.body || {};
    const nextTable = body.tableId ? await getTableOrFail(body.tableId, reservation.restaurantId) : reservation.table;
    const nextDate = body.reservationDate || reservation.reservationDate;
    const nextTime = body.reservationTime || reservation.reservationTime;
    const nextGuestsCount = body.guestsCount !== undefined ? Number(body.guestsCount) : reservation.guestsCount;
    await ensureTableCanBeBooked(nextTable, nextGuestsCount, nextDate, nextTime, reservation.id);

    reservation.table = nextTable;
    reservation.reservationDate = nextDate;
    reservation.reservationTime = nextTime;
    reservation.guestsCount = nextGuestsCount;
    reservation.comment = body.comment !== undefined ? body.comment : reservation.comment;

    response.send({ data: await serializeReservation(await reservations().save(reservation), (request as any).requestId) });
}));

app.post('/reservations/:reservationId/cancel', authContextMiddleware, asyncHandler(async (request: RequestWithAuth, response) => {
    const reservation = await getReservationOrFail(getParam(request.params.reservationId, 'reservationId'));
    if (!canAccessReservation(reservation, request)) {
        throw forbidden('You cannot cancel this reservation');
    }
    if (reservation.status === ReservationStatus.CANCELLED) {
        throw conflict('RESERVATION_ALREADY_CANCELLED', 'Reservation is already cancelled');
    }
    if (reservation.status === ReservationStatus.COMPLETED) {
        throw conflict('RESERVATION_COMPLETED', 'Completed reservation cannot be cancelled');
    }
    reservation.status = ReservationStatus.CANCELLED;
    reservation.cancelReason = request.body?.reason;
    response.send({ data: await serializeReservation(await reservations().save(reservation), (request as any).requestId) });
}));

app.patch('/admin/reservations/:reservationId/status', authContextMiddleware, requireRole(UserRole.ADMIN), asyncHandler(async (request, response) => {
    const reservation = await getReservationOrFail(getParam(request.params.reservationId, 'reservationId'));
    if (!Object.values(ReservationStatus).includes(request.body?.status)) {
        throw new ApiError(422, 'VALIDATION_ERROR', 'Reservation status is invalid');
    }
    reservation.status = request.body.status;
    response.send({ data: await serializeReservation(await reservations().save(reservation), (request as any).requestId) });
}));

app.post('/internal/availability/search', asyncHandler(async (request, response) => {
    const { restaurantIds, reservationDate, reservationTime, guestsCount } = request.body || {};
    const data = [];
    for (const restaurantId of restaurantIds || []) {
        const restaurantTables = await tables().find({ where: { restaurantId, isActive: true } });
        let availableTablesCount = 0;
        for (const table of restaurantTables.filter((item) => item.capacity >= Number(guestsCount))) {
            const conflicts = await reservations().find({
                where: { table: { id: table.id }, reservationDate, reservationTime },
                relations: { table: true },
            });
            if (!conflicts.some((reservation) => activeReservationStatuses.includes(reservation.status))) {
                availableTablesCount += 1;
            }
        }
        data.push({ restaurantId, hasAvailableTables: availableTablesCount > 0, availableTablesCount });
    }
    response.send({ data });
}));

app.get('/internal/reservations/:reservationId/summary', asyncHandler(async (request, response) => {
    const reservation = await getReservationOrFail(getParam(request.params.reservationId, 'reservationId'));
    response.send({
        data: {
            id: reservation.id,
            userId: reservation.userId,
            restaurantId: reservation.restaurantId,
            tableId: reservation.table.id,
            status: reservation.status,
            reservationDate: reservation.reservationDate,
            reservationTime: reservation.reservationTime,
            guestsCount: reservation.guestsCount,
        },
    });
}));

app.use(errorHandler);

reservationDataSource.initialize()
    .then(() => {
        app.listen(SETTINGS.RESERVATION_PORT, SETTINGS.RESERVATION_HOST, () => {
            console.log(`reservation-service listening at http://${SETTINGS.RESERVATION_HOST}:${SETTINGS.RESERVATION_PORT}`);
        });
    })
    .catch((error) => {
        console.error('reservation-service failed to start', error);
        process.exit(1);
    });
