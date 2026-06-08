import amqplib, { Channel, ChannelModel } from 'amqplib';

const AMQP_URL = process.env.AMQP_URL || 'amqp://localhost:5672';
const EXCHANGE = 'rental.events'; // topic-exchange для доменных событий

let connection: ChannelModel;
let channel: Channel;

/**
 * Подключение к RabbitMQ с повторными попытками (брокер может стартовать
 * дольше сервисов). Объявляет общий topic-exchange.
 */
export async function connectBroker(serviceName: string, retries = 10): Promise<Channel> {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            connection = await amqplib.connect(AMQP_URL);
            channel = await connection.createChannel();
            await channel.assertExchange(EXCHANGE, 'topic', { durable: true });
            console.log(`[${serviceName}] подключён к RabbitMQ (${AMQP_URL}), exchange '${EXCHANGE}'`);
            return channel;
        } catch (err) {
            console.log(`[${serviceName}] RabbitMQ недоступен (попытка ${attempt}/${retries}), повтор через 2с...`);
            await new Promise((r) => setTimeout(r, 2000));
        }
    }
    throw new Error(`[${serviceName}] не удалось подключиться к RabbitMQ`);
}

/** Публикация доменного события по routing key (например, 'booking.confirmed'). */
export function publishEvent(routingKey: string, payload: any): void {
    if (!channel) {
        console.error('publishEvent: канал RabbitMQ не инициализирован');
        return;
    }
    const message = Buffer.from(JSON.stringify({ event: routingKey, payload, occurredAt: new Date().toISOString() }));
    channel.publish(EXCHANGE, routingKey, message, { persistent: true });
    console.log(`-> опубликовано событие '${routingKey}':`, JSON.stringify(payload));
}

/**
 * Подписка сервиса на события. Создаёт именованную очередь сервиса и
 * привязывает её к нужным routing key (поддерживаются шаблоны, напр. 'booking.*').
 */
export async function consumeEvents(
    queueName: string,
    routingKeys: string[],
    handler: (routingKey: string, payload: any) => Promise<void> | void,
): Promise<void> {
    if (!channel) throw new Error('consumeEvents: канал RabbitMQ не инициализирован');
    await channel.assertQueue(queueName, { durable: true });
    for (const key of routingKeys) {
        await channel.bindQueue(queueName, EXCHANGE, key);
    }
    await channel.consume(queueName, async (msg) => {
        if (!msg) return;
        try {
            const { event, payload } = JSON.parse(msg.content.toString());
            console.log(`<- получено событие '${event}' в очереди '${queueName}'`);
            await handler(event, payload);
            channel.ack(msg);
        } catch (err) {
            console.error('Ошибка обработки события:', (err as Error).message);
            channel.nack(msg, false, false); // отбрасываем «битое» сообщение
        }
    });
    console.log(`[${queueName}] подписан на: ${routingKeys.join(', ')}`);
}
