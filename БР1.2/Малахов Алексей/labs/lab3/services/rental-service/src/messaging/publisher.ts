import amqplib, { Channel } from 'amqplib';
import SETTINGS from '../config/settings';

export const RENTAL_EVENTS_QUEUE = 'rental_events';

let channel: Channel | null = null;

export async function connectPublisher(): Promise<void> {
    try {
        const connection = await amqplib.connect(SETTINGS.RABBITMQ_URL);
        channel = await connection.createChannel();
        await channel.assertQueue(RENTAL_EVENTS_QUEUE, { durable: true });
        console.log('[rental-service] RabbitMQ publisher connected');

        connection.on('close', () => {
            console.warn('[rental-service] RabbitMQ connection closed, reconnecting...');
            channel = null;
            setTimeout(connectPublisher, 5000);
        });
        connection.on('error', (err) => {
            console.error('[rental-service] RabbitMQ error:', err.message);
        });
    } catch (err) {
        console.error('[rental-service] RabbitMQ connect failed, retrying in 5s:', (err as Error).message);
        setTimeout(connectPublisher, 5000);
    }
}

export async function publishRentalStatusChanged(
    rentalId: number,
    propertyId: number,
    propertyStatus: string,
): Promise<void> {
    if (!channel) {
        console.warn('[rental-service] RabbitMQ not ready, status update skipped for property', propertyId);
        return;
    }
    const payload = JSON.stringify({
        event: 'rental.status_changed',
        rental_id: rentalId,
        property_id: propertyId,
        property_status: propertyStatus,
    });
    channel.sendToQueue(RENTAL_EVENTS_QUEUE, Buffer.from(payload), { persistent: true });
    console.log(`[rental-service] Published → ${RENTAL_EVENTS_QUEUE}: ${payload}`);
}
