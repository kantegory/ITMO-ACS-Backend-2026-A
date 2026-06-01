import amqp, { Channel, ConsumeMessage } from 'amqplib';

import SETTINGS from '../config/settings';

const RECONNECT_DELAY_MS = 5000;

export type ApplicationCreatedEvent = {
    eventId: string;
    eventType: 'application.created';
    occurredAt: string;
    payload: {
        applicationId: string;
        vacancyId: string;
        applicantId: string;
        resumeId: string;
        status: string;
    };
};

export async function startApplicationCreatedConsumer(
    handler: (event: ApplicationCreatedEvent) => Promise<void>,
): Promise<void> {
    async function connect(): Promise<void> {
        let channel: Channel | undefined;

        try {
            const connection = await amqp.connect(SETTINGS.RABBITMQ_URL);

            connection.on('error', (error) => {
                console.error('RabbitMQ consumer connection error:', error);
            });
            connection.on('close', () => {
                console.error(
                    `RabbitMQ consumer connection closed. Reconnecting in ${RECONNECT_DELAY_MS}ms`,
                );
                setTimeout(connect, RECONNECT_DELAY_MS);
            });

            channel = await connection.createChannel();
            await channel.assertExchange(SETTINGS.RABBITMQ_EXCHANGE, 'topic', {
                durable: true,
            });
            await channel.assertQueue(SETTINGS.APPLICATION_CREATED_QUEUE, {
                durable: true,
            });
            await channel.bindQueue(
                SETTINGS.APPLICATION_CREATED_QUEUE,
                SETTINGS.RABBITMQ_EXCHANGE,
                'application.created',
            );
            await channel.prefetch(10);

            await channel.consume(
                SETTINGS.APPLICATION_CREATED_QUEUE,
                async (message) => {
                    if (!message) {
                        return;
                    }

                    await handleMessage(channel as Channel, message, handler);
                },
            );

            console.log(
                `RabbitMQ consumer subscribed to ${SETTINGS.APPLICATION_CREATED_QUEUE}`,
            );
        } catch (error) {
            console.error(
                `RabbitMQ consumer is unavailable. Reconnecting in ${RECONNECT_DELAY_MS}ms:`,
                error,
            );
            try {
                await channel?.close();
            } catch {
                // The connection is already broken.
            }
            setTimeout(connect, RECONNECT_DELAY_MS);
        }
    }

    await connect();
}

async function handleMessage(
    channel: Channel,
    message: ConsumeMessage,
    handler: (event: ApplicationCreatedEvent) => Promise<void>,
): Promise<void> {
    try {
        const event = JSON.parse(
            message.content.toString('utf8'),
        ) as ApplicationCreatedEvent;

        if (event.eventType !== 'application.created') {
            console.error(`Unexpected event type: ${event.eventType}`);
            channel.ack(message);
            return;
        }

        await handler(event);
        channel.ack(message);
    } catch (error) {
        console.error('Failed to process application.created event:', error);
        channel.nack(message, false, false);
    }
}
