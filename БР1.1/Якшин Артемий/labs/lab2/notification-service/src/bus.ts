// Шина событий (RabbitMQ): подписка на доменные события topic-exchange.
// Очередь долговечная, ручной ack, автоматическое переподключение при разрыве.
import amqp from 'amqplib';

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';
const EXCHANGE = process.env.EVENTS_EXCHANGE || 'restaurant.events';
const QUEUE = process.env.QUEUE_NAME || 'notifications';
// какие события слушаем (routing keys; '#' = все)
const BINDINGS = (process.env.EVENT_BINDINGS || 'reservation.created,reservation.cancelled,review.created')
  .split(',').map((s) => s.trim()).filter(Boolean);

export interface DomainEvent {
  event: string;
  occurred_at: string;
  data: Record<string, any>;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Запуск потребителя с переподключением. handle вызывается на каждое событие. */
export async function startConsumer(handle: (ev: DomainEvent) => Promise<void>): Promise<void> {
  for (;;) {
    try {
      const conn = await amqp.connect(RABBITMQ_URL);
      const ch = await conn.createChannel();
      await ch.assertExchange(EXCHANGE, 'topic', { durable: true });
      const q = await ch.assertQueue(QUEUE, { durable: true });
      for (const key of BINDINGS) await ch.bindQueue(q.queue, EXCHANGE, key);
      await ch.prefetch(10);
      console.log(`[bus] consuming "${q.queue}" <- "${EXCHANGE}" keys=[${BINDINGS.join(', ')}]`);

      await ch.consume(q.queue, async (msg: amqp.ConsumeMessage | null) => {
        if (!msg) return;
        try {
          const ev = JSON.parse(msg.content.toString()) as DomainEvent;
          await handle(ev);
          ch.ack(msg);
        } catch (e) {
          console.error('[bus] handler failed, dropping message:', (e as Error).message);
          ch.nack(msg, false, false); // без повторной постановки в очередь
        }
      });

      // ждём закрытия соединения, затем переподключаемся
      await new Promise<void>((resolve) => {
        conn.on('close', () => { console.warn('[bus] connection closed, reconnecting...'); resolve(); });
        conn.on('error', (e: Error) => console.warn('[bus] connection error:', e.message));
      });
    } catch (e) {
      console.warn(`[bus] connect failed (${(e as Error).message}), retry in 2s`);
    }
    await sleep(2000);
  }
}
