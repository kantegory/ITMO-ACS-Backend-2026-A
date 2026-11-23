import amqp from 'amqplib';

const EXCHANGE_NAME = 'user-exchange';
let channel: amqp.Channel | null = null;

export async function connectRabbitMQ(): Promise<void> {
    try {
        const url = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';
        const connection = await amqp.connect(url);
        channel = await connection.createChannel();
        await channel.assertExchange(EXCHANGE_NAME, 'topic', { durable: true });
        console.log('[RabbitMQ] Connected and exchange asserted');
    } catch (error) {
        console.error('[RabbitMQ] Connection failed:', error);
    }
}

export async function publishUserCreated(user: { id: number; username: string }): Promise<void> {
    if (!channel) return;
    const message = JSON.stringify({ userId: user.id, username: user.username });
    channel.publish(EXCHANGE_NAME, 'user.created', Buffer.from(message));
    console.log(`[RabbitMQ] Published user.created: ${message}`);
}

export async function publishUserDeleted(userId: number): Promise<void> {
    if (!channel) return;
    const message = JSON.stringify({ userId });
    channel.publish(EXCHANGE_NAME, 'user.deleted', Buffer.from(message));
    console.log(`[RabbitMQ] Published user.deleted: ${message}`);
}