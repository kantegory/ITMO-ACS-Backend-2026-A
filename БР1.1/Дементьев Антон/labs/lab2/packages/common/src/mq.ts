import amqplib, { Channel, ChannelModel, ConsumeMessage } from 'amqplib';

// Топик-обмен, через который сервисы публикуют события (ДЗ5: RabbitMQ вместо HTTP)
export const EVENTS_EXCHANGE = 'jobsearch.events';

const url = () => process.env.RABBITMQ_URL || 'amqp://guest:guest@rabbitmq:5672';

let connection: ChannelModel | undefined;
let channel: Channel | undefined;
let connecting: Promise<Channel> | undefined;

async function connectOnce(): Promise<Channel> {
    const conn = await amqplib.connect(url());
    conn.on('error', (e: any) => console.warn(`[rabbitmq] ошибка соединения: ${e?.message}`));
    conn.on('close', () => { connection = undefined; channel = undefined; });
    const ch = await conn.createChannel();
    ch.on('error', (e: any) => console.warn(`[rabbitmq] ошибка канала: ${e?.message}`));
    await ch.assertExchange(EVENTS_EXCHANGE, 'topic', { durable: true });
    connection = conn;
    channel = ch;
    return ch;
}

// Брокер может подняться позже сервиса: пробуем подключиться несколько раз, как и с БД
async function connectWithRetry(): Promise<Channel> {
    for (let i = 1; ; i++) {
        try { return await connectOnce(); }
        catch (e: any) {
            if (i >= 30) throw e;
            console.warn(`[rabbitmq] недоступен (${e?.message}), попытка ${i}`);
            await new Promise((r) => setTimeout(r, 2000));
        }
    }
}

export async function getChannel(): Promise<Channel> {
    if (channel) return channel;
    if (!connecting) connecting = connectWithRetry().finally(() => { connecting = undefined; });
    return connecting;
}

// Для health-эндпоинта: канал уже открыт и жив (без блокирующего переподключения)
export function isBrokerConnected(): boolean {
    return !!channel;
}

export async function publishEnvelope(routingKey: string, envelope: unknown): Promise<void> {
    const ch = await getChannel();
    const ok = ch.publish(EVENTS_EXCHANGE, routingKey, Buffer.from(JSON.stringify(envelope)), {
        contentType: 'application/json',
        persistent: true,
    });
    if (!ok) await new Promise<void>((resolve) => ch.once('drain', () => resolve()));
}

export interface ConsumerOptions {
    queue: string;
    routingKeys: string[];
    handler: (envelope: any) => Promise<void>;
    maxAttempts?: number;
    prefetch?: number;
}

// Подписка сервиса-получателя: durable-очередь, привязанная к нужным routing key на общем обмене.
// При ошибке обработчика сообщение переотправляется в ту же очередь с счётчиком попыток (x-attempt);
// после исчерпания попыток уходит в dead-letter обмен/очередь <queue>.dead для ручного разбора.
export function startEventConsumer(opts: ConsumerOptions): void {
    const maxAttempts = opts.maxAttempts ?? 5;
    const dlx = `${opts.queue}.dlx`;
    const deadQueue = `${opts.queue}.dead`;

    const setup = async () => {
        for (;;) {
            try {
                const ch = await getChannel();
                await ch.assertExchange(dlx, 'fanout', { durable: true });
                await ch.assertQueue(deadQueue, { durable: true });
                await ch.bindQueue(deadQueue, dlx, '');
                await ch.assertQueue(opts.queue, { durable: true, arguments: { 'x-dead-letter-exchange': dlx } });
                for (const rk of opts.routingKeys) await ch.bindQueue(opts.queue, EVENTS_EXCHANGE, rk);
                await ch.prefetch(opts.prefetch ?? 10);

                await ch.consume(opts.queue, (msg) => handleMessage(ch, opts, msg, maxAttempts), { noAck: false });
                console.log(`[${opts.queue}] слушает события: ${opts.routingKeys.join(', ')}`);
                return;
            } catch (e: any) {
                console.warn(`[${opts.queue}] не удалось подписаться на RabbitMQ (${e?.message}), повтор через 2с`);
                await new Promise((r) => setTimeout(r, 2000));
            }
        }
    };
    setup();
}

async function handleMessage(ch: Channel, opts: ConsumerOptions, msg: ConsumeMessage | null, maxAttempts: number) {
    if (!msg) return;
    const attempt = Number(msg.properties.headers?.['x-attempt'] ?? 1);
    let envelope: any;
    try {
        envelope = JSON.parse(msg.content.toString('utf8'));
    } catch (e) {
        console.warn(`[${opts.queue}] событие с некорректным телом, отправлено в dead-letter`);
        ch.nack(msg, false, false);
        return;
    }
    try {
        await opts.handler(envelope);
        ch.ack(msg);
    } catch (e: any) {
        console.warn(`[${opts.queue}] ошибка обработки события ${envelope?.type} (${envelope?.event_id}), попытка ${attempt}/${maxAttempts}: ${e?.message}`);
        if (attempt < maxAttempts) {
            ch.sendToQueue(opts.queue, msg.content, {
                contentType: 'application/json',
                persistent: true,
                headers: { ...msg.properties.headers, 'x-attempt': attempt + 1 },
            });
            ch.ack(msg);
        } else {
            ch.nack(msg, false, false); // попытки исчерпаны — в dead-letter очередь на ручной разбор
        }
    }
}
