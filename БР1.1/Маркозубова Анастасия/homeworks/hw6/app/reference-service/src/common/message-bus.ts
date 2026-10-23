import amqplib, { Channel, Connection, ConsumeMessage } from 'amqplib';

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
const EXCHANGE = 'job_board.events';

class MessageBus {
    private connection?: Connection;
    private channel?: Channel;
    private serviceName = 'unknown';
    private subscribed = false;

    private delay(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    async connect(serviceName: string): Promise<void> {
        this.serviceName = serviceName;

        if (this.channel) {
            return;
        }

        for (let attempt = 1; attempt <= 30; attempt += 1) {
            try {
                this.connection = await amqplib.connect(RABBITMQ_URL);
                this.channel = await this.connection.createChannel();
                await this.channel.assertExchange(EXCHANGE, 'topic', {
                    durable: false,
                });
                console.log(
                    `${serviceName} connected to RabbitMQ exchange ${EXCHANGE}`,
                );
                return;
            } catch (error) {
                console.error(
                    `${serviceName} RabbitMQ connection attempt ${attempt} failed:`,
                    error,
                );
                await this.delay(2000);
            }
        }

        throw new Error(`${serviceName} could not connect to RabbitMQ`);
    }

    async publish(routingKey: string, payload: Record<string, unknown>): Promise<void> {
        if (!this.channel) {
            await this.connect(this.serviceName);
            await this.subscribeToDomainEvents();
        }

        this.channel.publish(
            EXCHANGE,
            routingKey,
            Buffer.from(
                JSON.stringify({
                    service: this.serviceName,
                    event: routingKey,
                    payload,
                    created_at: new Date().toISOString(),
                }),
            ),
        );
    }

    async subscribeToDomainEvents(): Promise<void> {
        if (!this.channel || this.subscribed) {
            return;
        }

        const queueName = `${this.serviceName}.events`;
        await this.channel.assertQueue(queueName, { durable: true });
        await this.channel.bindQueue(queueName, EXCHANGE, '#');
        await this.channel.consume(queueName, (message?: ConsumeMessage | null) => {
            if (!message) {
                return;
            }

            const event = JSON.parse(message.content.toString());
            if (event.service !== this.serviceName) {
                console.log(`${this.serviceName} received event ${event.event} from ${event.service}`);
            }
            this.channel!.ack(message);
        });
        this.subscribed = true;
    }
}

export const messageBus = new MessageBus();
