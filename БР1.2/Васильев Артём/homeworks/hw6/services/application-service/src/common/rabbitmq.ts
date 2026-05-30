import amqp, { Channel } from 'amqplib';

import SETTINGS from '../config/settings';

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

class RabbitMqPublisher {
    private channel?: Channel;
    private connecting?: Promise<Channel>;

    private async getChannel(): Promise<Channel> {
        if (this.channel) {
            return this.channel;
        }

        if (!this.connecting) {
            this.connecting = this.connect();
        }

        this.channel = await this.connecting;
        this.connecting = undefined;
        return this.channel;
    }

    private async connect(): Promise<Channel> {
        try {
            const connection = await amqp.connect(SETTINGS.RABBITMQ_URL);

            connection.on('error', (error) => {
                console.error('RabbitMQ publisher connection error:', error);
                this.channel = undefined;
                this.connecting = undefined;
            });
            connection.on('close', () => {
                console.error('RabbitMQ publisher connection closed');
                this.channel = undefined;
                this.connecting = undefined;
            });

            const channel = await connection.createChannel();
            await channel.assertExchange(SETTINGS.RABBITMQ_EXCHANGE, 'topic', {
                durable: true,
            });

            console.log('RabbitMQ publisher connected');
            return channel;
        } catch (error) {
            this.connecting = undefined;
            console.error('RabbitMQ publisher is unavailable:', error);
            throw error;
        }
    }

    async publishApplicationCreated(
        event: ApplicationCreatedEvent,
    ): Promise<void> {
        try {
            const channel = await this.getChannel();
            channel.publish(
                SETTINGS.RABBITMQ_EXCHANGE,
                event.eventType,
                Buffer.from(JSON.stringify(event)),
                {
                    contentType: 'application/json',
                    deliveryMode: 2,
                    messageId: event.eventId,
                    timestamp: Math.floor(Date.now() / 1000),
                },
            );
        } catch (error) {
            console.error(
                'Application was saved, but application.created was not published:',
                error,
            );
        }
    }
}

export const rabbitMqPublisher = new RabbitMqPublisher();
