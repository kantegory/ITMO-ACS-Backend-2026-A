import amqp, {Channel, ChannelModel, Connection} from 'amqplib';

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
const EXCHANGE_NAME = 'rental.events';

let connection: ChannelModel = null;
let channel: Channel | null = null;

export async function connectRabbitMQ() {
    try {
        connection = await amqp.connect(RABBITMQ_URL);
        channel = await connection.createChannel();

        // Создаем exchange типа topic для маршрутизации событий
        await channel.assertExchange(EXCHANGE_NAME, 'topic', { durable: true });

        console.log('Connected to RabbitMQ');
        return { connection, channel };
    } catch (error) {
        console.error('RabbitMQ connection error:', error);
        throw error;
    }
}

export function getChannel() {
    if (!channel) {
        throw new Error('RabbitMQ not connected');
    }
    return channel;
}

export function getExchangeName() {
    return EXCHANGE_NAME;
}

export async function closeRabbitMQ() {
    try {
        if (channel) await channel.close();
        if (connection) await connection.close();
        console.log('RabbitMQ connection closed');
    } catch (error) {
        console.error('Error closing RabbitMQ:', error);
    }
}
