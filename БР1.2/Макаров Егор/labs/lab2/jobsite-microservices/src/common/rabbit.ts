import amqp, { Channel, ChannelModel } from 'amqplib';
import { env } from './env';

// Единый topic-exchange для доменных событий
export const EXCHANGE = 'jobsite.events';

let channel: Channel | null = null;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Подключение с повторными попытками (RabbitMQ стартует не мгновенно)
const connect = async (): Promise<Channel> => {
  if (channel) return channel;
  let lastErr: unknown;
  for (let attempt = 1; attempt <= 15; attempt += 1) {
    try {
      const conn: ChannelModel = await amqp.connect(env.rabbitmqUrl);
      const ch = await conn.createChannel();
      await ch.assertExchange(EXCHANGE, 'topic', { durable: true });
      channel = ch;
      // eslint-disable-next-line no-console
      console.log('[rabbit] подключено к RabbitMQ');
      return ch;
    } catch (e) {
      lastErr = e;
      // eslint-disable-next-line no-console
      console.log(`[rabbit] попытка ${attempt}: RabbitMQ недоступен, повтор через 2с`);
      await sleep(2000);
    }
  }
  throw lastErr;
};

// Опубликовать событие с заданным routing key
export const publishEvent = async (routingKey: string, payload: unknown): Promise<void> => {
  const ch = await connect();
  ch.publish(EXCHANGE, routingKey, Buffer.from(JSON.stringify(payload)), { persistent: true });
  // eslint-disable-next-line no-console
  console.log(`[rabbit] опубликовано событие ${routingKey}`);
};

// Подписаться на события по шаблону routing key в именованную очередь
export const consumeEvent = async (
  queue: string,
  pattern: string,
  handler: (payload: Record<string, unknown>) => Promise<void>,
): Promise<void> => {
  const ch = await connect();
  await ch.assertQueue(queue, { durable: true });
  await ch.bindQueue(queue, EXCHANGE, pattern);
  await ch.consume(queue, async (msg) => {
    if (!msg) return;
    try {
      await handler(JSON.parse(msg.content.toString()));
      ch.ack(msg);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('[rabbit] ошибка обработки события:', e);
      ch.nack(msg, false, false); // отбрасываем (без бесконечного повтора)
    }
  });
  // eslint-disable-next-line no-console
  console.log(`[rabbit] подписка: очередь ${queue} <- ${pattern}`);
};
