import amqp, { Channel, ChannelModel, ConsumeMessage } from 'amqplib';
import { randomUUID } from 'node:crypto';
import { SETTINGS } from './settings';

let connection: ChannelModel | undefined;
let channel: Channel | undefined;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const getChannel = async () => {
    if (channel) {
        return channel;
    }

    let lastError: unknown;
    for (let attempt = 1; attempt <= 12; attempt += 1) {
        try {
            connection = await amqp.connect(SETTINGS.RABBITMQ_URL);
            connection.on('error', (error) => {
                console.error('rabbitmq connection error', error.message);
            });
            connection.on('close', () => {
                connection = undefined;
                channel = undefined;
                console.error('rabbitmq connection closed');
            });

            channel = await connection.createChannel();
            await channel.assertExchange(SETTINGS.RABBITMQ_EVENTS_EXCHANGE, 'topic', { durable: true });
            return channel;
        } catch (error) {
            lastError = error;
            console.error(`rabbitmq connection attempt ${attempt} failed`);
            await sleep(1000);
        }
    }

    throw lastError;
};

export const publishEvent = async <T extends object>(routingKey: string, payload: T) => {
    const bus = await getChannel();
    const messageId = 'eventId' in payload && typeof payload.eventId === 'string'
        ? payload.eventId
        : randomUUID();

    bus.publish(
        SETTINGS.RABBITMQ_EVENTS_EXCHANGE,
        routingKey,
        Buffer.from(JSON.stringify(payload)),
        {
            contentType: 'application/json',
            deliveryMode: 2,
            messageId,
            timestamp: Math.floor(Date.now() / 1000),
        },
    );
};

export const consumeEvents = async <T extends object>(
    queueName: string,
    routingKeys: string[],
    handler: (payload: T, message: ConsumeMessage) => Promise<void>,
) => {
    const bus = await getChannel();
    await bus.assertQueue(queueName, { durable: true });
    for (const routingKey of routingKeys) {
        await bus.bindQueue(queueName, SETTINGS.RABBITMQ_EVENTS_EXCHANGE, routingKey);
    }
    await bus.prefetch(10);

    await bus.consume(queueName, async (message) => {
        if (!message) {
            return;
        }

        try {
            const payload = JSON.parse(message.content.toString('utf8')) as T;
            await handler(payload, message);
            bus.ack(message);
        } catch (error) {
            console.error('rabbitmq message handling failed', error);
            bus.nack(message, false, false);
        }
    });
};
