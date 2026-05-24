import amqp from 'amqplib';
import SETTINGS from '../config/settings';

let channel: amqp.Channel | null = null;

async function getChannel(): Promise<amqp.Channel> {
    if (!channel) {
        const connection = await amqp.connect(SETTINGS.RABBITMQ_URL);
        channel = await connection.createChannel();
    }
    return channel;
}

export async function publishReservationCreated(payload: {
    reservation_id: number;
    user_id: number;
    table_id: number;
    restaurant_id: number;
    reservation_time: string;
    guest_number: number;
}): Promise<void> {
    try {
        const ch = await getChannel();
        await ch.assertExchange('reservations', 'topic', { durable: true });
        ch.publish('reservations', 'reservation.created', Buffer.from(JSON.stringify(payload)));
        console.log('[RabbitMQ] Published reservation.created');
    } catch (err) {
        console.error('[RabbitMQ] Failed to publish reservation.created:', err);
    }
}

export async function publishReservationCancelled(payload: {
    reservation_id: number;
    user_id: number;
    reason?: string;
}): Promise<void> {
    try {
        const ch = await getChannel();
        await ch.assertExchange('reservations', 'topic', { durable: true });
        ch.publish('reservations', 'reservation.cancelled', Buffer.from(JSON.stringify(payload)));
        console.log('[RabbitMQ] Published reservation.cancelled');
    } catch (err) {
        console.error('[RabbitMQ] Failed to publish reservation.cancelled:', err);
    }
}
