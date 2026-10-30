import { SETTINGS } from '../../common/settings';
import { serviceRequest } from '../../common/http-client';
import { Reservation, RestaurantTable } from './entities';

const toIsoString = (value?: Date | null) => (value ? value.toISOString() : null);

export const serializeTable = (table: RestaurantTable) => ({
    id: table.id,
    restaurantId: table.restaurantId,
    tableNumber: table.tableNumber,
    capacity: table.capacity,
    isActive: table.isActive,
    createdAt: toIsoString(table.createdAt),
    updatedAt: toIsoString(table.updatedAt),
});

export const serializeReservation = async (reservation: Reservation, requestId?: string) => {
    const [userResponse, restaurantResponse] = await Promise.all([
        serviceRequest<any>(
            SETTINGS.IDENTITY_SERVICE_URL,
            `/internal/users/${reservation.userId}/summary`,
            { requestId },
        ).catch(() => ({ data: { id: reservation.userId } })),
        serviceRequest<any>(
            SETTINGS.CATALOG_SERVICE_URL,
            `/internal/restaurants/${reservation.restaurantId}/summary?requirePublished=false`,
            { requestId },
        ).catch(() => ({ data: { id: reservation.restaurantId } })),
    ]);

    return {
        id: reservation.id,
        user: userResponse.data,
        restaurant: restaurantResponse.data,
        table: {
            id: reservation.table.id,
            tableNumber: reservation.table.tableNumber,
            capacity: reservation.table.capacity,
        },
        status: reservation.status,
        reservationDate: reservation.reservationDate,
        reservationTime: reservation.reservationTime,
        guestsCount: reservation.guestsCount,
        comment: reservation.comment || undefined,
        cancelReason: reservation.cancelReason || undefined,
        createdAt: toIsoString(reservation.createdAt),
        updatedAt: toIsoString(reservation.updatedAt),
    };
};
