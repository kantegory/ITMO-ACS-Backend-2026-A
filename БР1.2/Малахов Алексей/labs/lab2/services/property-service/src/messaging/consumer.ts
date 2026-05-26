import amqplib from 'amqplib';
import SETTINGS from '../config/settings';
import dataSource from '../config/data-source';
import { Property } from '../models/property.entity';
import { PropertyStatus } from '../models/enums';
import { publishPropertyStatusChanged } from './publisher';

const RENTAL_EVENTS_QUEUE = 'rental_events';

export async function startConsumer(): Promise<void> {
    try {
        const connection = await amqplib.connect(SETTINGS.RABBITMQ_URL);
        const channel = await connection.createChannel();
        await channel.assertQueue(RENTAL_EVENTS_QUEUE, { durable: true });
        channel.prefetch(1);

        console.log('[property-service] RabbitMQ consumer started');

        connection.on('close', () => {
            console.warn('[property-service] RabbitMQ consumer connection closed, reconnecting...');
            setTimeout(startConsumer, 5000);
        });
        connection.on('error', (err) => {
            console.error('[property-service] RabbitMQ consumer error:', err.message);
        });

        channel.consume(RENTAL_EVENTS_QUEUE, async (msg) => {
            if (!msg) return;
            try {
                const data = JSON.parse(msg.content.toString());
                if (data.event === 'rental.status_changed') {
                    const repo = dataSource.getRepository(Property);
                    const property = await repo.findOneBy({ id: data.property_id });
                    if (property) {
                        property.status = data.property_status as PropertyStatus;
                        await repo.save(property);
                        console.log(
                            `[property-service] Property ${data.property_id} status → ${data.property_status}` +
                            ` (rental ${data.rental_id})`,
                        );
                        await publishPropertyStatusChanged(
                            property.id,
                            data.property_status,
                            data.rental_id,
                            property.ownerId,
                        );
                    }
                }
                channel.ack(msg);
            } catch (err) {
                console.error('[property-service] Failed to process message:', err);
                channel.nack(msg, false, false);
            }
        });
    } catch (err) {
        console.error('[property-service] RabbitMQ connect failed, retrying in 5s:', (err as Error).message);
        setTimeout(startConsumer, 5000);
    }
}
