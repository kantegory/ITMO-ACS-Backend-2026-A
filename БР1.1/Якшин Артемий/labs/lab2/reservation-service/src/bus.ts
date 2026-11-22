// Шина событий (RabbitMQ): публикация доменных событий в topic-exchange.
// Публикация — «best effort»: сбой брокера не должен ломать ответ клиенту.
import amqp from 'amqplib';

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';
export const EXCHANGE = process.env.EVENTS_EXCHANGE || 'restaurant.events';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let conn: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let channel: any = null;
let connecting: Promise<void> | null = null;

async function connect(): Promise<void> {
  if (channel) return;
  if (connecting) return connecting;
  connecting = (async () => {
    const c = await amqp.connect(RABBITMQ_URL);
    c.on('error', (e: Error) => console.warn('[bus] connection error:', e.message));
    c.on('close', () => { conn = null; channel = null; });
    const ch = await c.createChannel();
    await ch.assertExchange(EXCHANGE, 'topic', { durable: true });
    conn = c;
    channel = ch;
    console.log(`[bus] connected to RabbitMQ, topic-exchange "${EXCHANGE}"`);
  })();
  try { await connecting; } finally { connecting = null; }
}

/** Подключение с повторами на старте сервиса (RabbitMQ может подниматься дольше). */
export async function initBus(retries = 30, delayMs = 2000): Promise<void> {
  for (let i = 1; i <= retries; i++) {
    try { await connect(); return; }
    catch (e) {
      console.warn(`[bus] connect ${i}/${retries} failed (${(e as Error).message}), retry in ${delayMs}ms`);
      await sleep(delayMs);
    }
  }
  console.error('[bus] could not connect to RabbitMQ; events will be dropped until it recovers');
}

/** Публикация доменного события. Конверт: { event, occurred_at, data }. */
export async function publishEvent(routingKey: string, data: Record<string, unknown>): Promise<void> {
  try {
    if (!channel) await connect();
    const envelope = { event: routingKey, occurred_at: new Date().toISOString(), data };
    channel.publish(EXCHANGE, routingKey, Buffer.from(JSON.stringify(envelope)), {
      persistent: true,
      contentType: 'application/json',
    });
    console.log(`[bus] -> ${routingKey}`, JSON.stringify(data));
  } catch (e) {
    // Событие некритично для HTTP-ответа: логируем и продолжаем (graceful degradation).
    console.warn(`[bus] publish ${routingKey} failed: ${(e as Error).message}`);
  }
}
