import { consumeEvents } from '../../shared/broker';
import dataSource from './data-source';
import { Property, PropertyStatus } from './models/property.entity';

/**
 * Catalog подписывается на события бронирования и асинхронно обновляет
 * статус объекта недвижимости (без синхронного REST-вызова от Booking).
 */
export async function startCatalogConsumers() {
    const properties = dataSource.getRepository(Property);

    await consumeEvents('catalog.booking-events', ['booking.confirmed', 'booking.active', 'booking.completed', 'booking.cancelled'], async (event, payload) => {
        const property = await properties.findOneBy({ id: payload.propertyId });
        if (!property) return;

        if (event === 'booking.confirmed' || event === 'booking.active') {
            property.status = PropertyStatus.RENTED;
        } else if (event === 'booking.completed' || event === 'booking.cancelled') {
            property.status = PropertyStatus.AVAILABLE;
        }
        await properties.save(property);
        console.log(`   [catalog] объект ${property.id} -> статус ${property.status} (по событию ${event})`);
    });
}
