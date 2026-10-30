import { getChannel, getExchangeName } from './connection';

export interface EventData {
    eventType: string;
    timestamp: string;
    data: Record<string, any>;
}

export async function publishEvent(eventType: string, data: Record<string, any>) {
    try {
        const channel = getChannel();
        const exchange = getExchangeName();

        const event: EventData = {
            eventType,
            timestamp: new Date().toISOString(),
            data
        };

        const message = Buffer.from(JSON.stringify(event));

        channel.publish(exchange, eventType, message, { persistent: true });

        console.log(`Event published: ${eventType}`, data);
    } catch (error) {
        console.error(`Failed to publish event ${eventType}:`, error);
    }
}
