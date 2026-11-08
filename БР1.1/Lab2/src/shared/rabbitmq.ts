import amqp, { Channel, ChannelModel, ConsumeMessage } from 'amqplib';

import SETTINGS from './settings';

type MessageHandler<T> = (payload: T) => Promise<void>;

let connectionPromise: Promise<ChannelModel> | null = null;
let channelPromise: Promise<Channel> | null = null;

const connect = async (): Promise<ChannelModel> => {
    if (!connectionPromise) {
        connectionPromise = amqp.connect(SETTINGS.RABBITMQ_URL);
    }

    return connectionPromise;
};

const getChannel = async (): Promise<Channel> => {
    if (!channelPromise) {
        channelPromise = connect().then(async (connection) => {
            const channel = await connection.createChannel();

            await channel.assertExchange(SETTINGS.RABBITMQ_EXCHANGE, 'topic', {
                durable: true,
            });

            return channel;
        });
    }

    return channelPromise;
};

export const publishDomainEvent = async <T>(
    routingKey: string,
    payload: T,
): Promise<boolean> => {
    const channel = await getChannel();

    return channel.publish(
        SETTINGS.RABBITMQ_EXCHANGE,
        routingKey,
        Buffer.from(JSON.stringify(payload)),
        {
            persistent: true,
            contentType: 'application/json',
        },
    );
};

const parseMessage = <T>(message: ConsumeMessage): T =>
    JSON.parse(message.content.toString('utf-8')) as T;

export const subscribeToQueue = async <T>(
    queueName: string,
    routingKey: string,
    handler: MessageHandler<T>,
): Promise<void> => {
    const channel = await getChannel();

    await channel.assertQueue(queueName, {
        durable: true,
    });
    await channel.bindQueue(queueName, SETTINGS.RABBITMQ_EXCHANGE, routingKey);
    await channel.prefetch(1);

    await channel.consume(queueName, async (message) => {
        if (!message) {
            return;
        }

        try {
            await handler(parseMessage<T>(message));
            channel.ack(message);
        } catch (error) {
            console.error(`RabbitMQ consumer failed for queue ${queueName}:`, error);
            channel.nack(message, false, true);
        }
    });
};
