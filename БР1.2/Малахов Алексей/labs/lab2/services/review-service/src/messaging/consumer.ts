import amqplib from 'amqplib';
import SETTINGS from '../config/settings';

const PROPERTY_EVENTS_QUEUE = 'property_events';

export async function startConsumer(): Promise<void> {
    try {
        const connection = await amqplib.connect(SETTINGS.RABBITMQ_URL);
        const channel = await connection.createChannel();
        await channel.assertQueue(PROPERTY_EVENTS_QUEUE, { durable: true });
        channel.prefetch(1);

        console.log('[review-service] RabbitMQ consumer started');

        connection.on('close', () => {
            console.warn('[review-service] RabbitMQ connection closed, reconnecting...');
            setTimeout(startConsumer, 5000);
        });
        connection.on('error', (err) => {
            console.error('[review-service] RabbitMQ error:', err.message);
        });

        channel.consume(PROPERTY_EVENTS_QUEUE, async (msg) => {
            if (!msg) return;
            try {
                const data = JSON.parse(msg.content.toString());
                if (data.event === 'property.status_changed') {
                    if (data.property_status === 'active') {
                        console.log(
                            `[review-service] Rental ${data.rental_id} completed —` +
                            ` review is now available for landlord ${data.owner_id}`,
                        );
                    } else {
                        console.log(
                            `[review-service] Property ${data.property_id} is now ${data.property_status}` +
                            ` (rental ${data.rental_id})`,
                        );
                    }
                }
                channel.ack(msg);
            } catch (err) {
                console.error('[review-service] Failed to process message:', err);
                channel.nack(msg, false, false);
            }
        });
    } catch (err) {
        console.error('[review-service] RabbitMQ connect failed, retrying in 5s:', (err as Error).message);
        setTimeout(startConsumer, 5000);
    }
}
