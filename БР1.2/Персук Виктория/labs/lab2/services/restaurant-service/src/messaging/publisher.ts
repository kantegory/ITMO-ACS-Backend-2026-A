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

export async function publishRestaurantStatusChanged(payload: {
    restaurant_id: number;
    restaurant_name: string;
    old_status: string;
    new_status: string;
    owner_user_id: number;
}): Promise<void> {
    try {
        const ch = await getChannel();
        const exchange = 'restaurants';
        await ch.assertExchange(exchange, 'topic', { durable: true });
        ch.publish(exchange, 'restaurant.status_changed', Buffer.from(JSON.stringify(payload)));
        console.log('[RabbitMQ] Published restaurant.status_changed:', payload);
    } catch (err) {
        console.error('[RabbitMQ] Failed to publish restaurant.status_changed:', err);
    }
}
