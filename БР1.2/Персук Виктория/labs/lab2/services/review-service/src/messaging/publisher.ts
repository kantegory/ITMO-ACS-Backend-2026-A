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

export async function publishReviewCreated(payload: {
    review_id: number;
    restaurant_id: number;
    user_id: number;
    rating: number;
    comment?: string;
}): Promise<void> {
    try {
        const ch = await getChannel();
        await ch.assertExchange('reviews', 'topic', { durable: true });
        ch.publish('reviews', 'review.created', Buffer.from(JSON.stringify(payload)));
        console.log('[RabbitMQ] Published review.created');
    } catch (err) {
        console.error('[RabbitMQ] Failed to publish review.created:', err);
    }
}

export async function publishReviewDeleted(payload: {
    review_id: number;
    restaurant_id: number;
}): Promise<void> {
    try {
        const ch = await getChannel();
        await ch.assertExchange('reviews', 'topic', { durable: true });
        ch.publish('reviews', 'review.deleted', Buffer.from(JSON.stringify(payload)));
        console.log('[RabbitMQ] Published review.deleted');
    } catch (err) {
        console.error('[RabbitMQ] Failed to publish review.deleted:', err);
    }
}
