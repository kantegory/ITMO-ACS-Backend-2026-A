import amqplib, { Channel } from 'amqplib';
import SETTINGS from '../config/settings';

export const PROPERTY_EVENTS_QUEUE = 'property_events';

let channel: Channel | null = null;

export async function connectPublisher(): Promise<void> {
    try {
        const connection = await amqplib.connect(SETTINGS.RABBITMQ_URL);
        channel = await connection.createChannel();
        await channel.assertQueue(PROPERTY_EVENTS_QUEUE, { durable: true });
        console.log('[property-service] RabbitMQ publisher connected');

        connection.on('close', () => {
            console.warn('[property-service] RabbitMQ publisher connection closed, reconnecting...');
            channel = null;
            setTimeout(connectPublisher, 5000);
        });
        connection.on('error', (err) => {
            console.error('[property-service] RabbitMQ publisher error:', err.message);
        });
    } catch (err) {
        console.error('[property-service] RabbitMQ publisher connect failed, retrying in 5s:', (err as Error).message);
        setTimeout(connectPublisher, 5000);
    }
}

export async function publishPropertyStatusChanged(
    propertyId: number,
    propertyStatus: string,
    rentalId: number,
    ownerId: number,
): Promise<void> {
    if (!channel) {
        console.warn('[property-service] RabbitMQ publisher not ready, skipping publish for property', propertyId);
        return;
    }
    const payload = JSON.stringify({
        event: 'property.status_changed',
        property_id: propertyId,
        property_status: propertyStatus,
        rental_id: rentalId,
        owner_id: ownerId,
    });
    channel.sendToQueue(PROPERTY_EVENTS_QUEUE, Buffer.from(payload), { persistent: true });
    console.log(`[property-service] Published → ${PROPERTY_EVENTS_QUEUE}: ${payload}`);
}
