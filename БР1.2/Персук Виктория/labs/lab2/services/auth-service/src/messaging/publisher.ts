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

export async function publishUserRegistered(payload: {
    user_id: number;
    email: string;
    first_name?: string;
}): Promise<void> {
    try {
        const ch = await getChannel();
        const exchange = 'auth';
        await ch.assertExchange(exchange, 'topic', { durable: true });
        ch.publish(exchange, 'user.registered', Buffer.from(JSON.stringify(payload)));
        console.log('[RabbitMQ] Published user.registered:', payload);
    } catch (err) {
        console.error('[RabbitMQ] Failed to publish user.registered:', err);
    }
}
