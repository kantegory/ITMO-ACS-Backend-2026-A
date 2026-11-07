/**
 * Шина событий на RabbitMQ (ДЗ5).
 *
 * Схема: один durable topic-exchange `recipes.events`; каждый потребитель
 * объявляет свою durable-очередь и привязывает её по routing-паттернам.
 * Неудачно обработанные сообщения уходят в dead-letter-exchange.
 *
 * Отказоустойчивость: если брокер недоступен, сервис продолжает обслуживать
 * HTTP-запросы. Публикация в этом случае логируется как предупреждение,
 * а подключение восстанавливается в фоне с экспоненциальной паузой.
 */
import { randomUUID } from 'crypto';
import amqplib, { Channel, ChannelModel, ConsumeMessage } from 'amqplib';

export interface EventEnvelope<T = Record<string, unknown>> {
  eventId: string;
  type: string;
  occurredAt: string;
  producer: string;
  version: number;
  payload: T;
}

export interface BusOptions {
  url: string;
  exchange: string;
  producer: string;
  enabled: boolean;
}

export type EventHandler = (event: EventEnvelope) => Promise<void>;

const DLX_SUFFIX = '.dlx';

export class EventBus {
  private connection: ChannelModel | null = null;
  private channel: Channel | null = null;
  private connecting: Promise<void> | null = null;
  private closed = false;
  private attempt = 0;
  private readonly subscriptions: Array<{ queue: string; patterns: string[]; handler: EventHandler }> = [];

  constructor(private readonly options: BusOptions) {}

  get isConnected(): boolean {
    return Boolean(this.channel);
  }

  private log(message: string, ...rest: unknown[]): void {
    // eslint-disable-next-line no-console
    console.log(`[bus:${this.options.producer}] ${message}`, ...rest);
  }

  /** Подключение к брокеру; при неудаче планирует повторную попытку и не бросает исключение. */
  async connect(): Promise<void> {
    if (!this.options.enabled) {
      this.log('шина отключена настройкой RABBITMQ_ENABLED=false');
      return;
    }
    if (this.connecting) return this.connecting;

    this.connecting = (async () => {
      try {
        const connection = await amqplib.connect(this.options.url);
        const channel = await connection.createChannel();
        await channel.assertExchange(this.options.exchange, 'topic', { durable: true });
        await channel.assertExchange(this.options.exchange + DLX_SUFFIX, 'topic', { durable: true });

        connection.on('error', () => undefined);
        connection.on('close', () => {
          if (this.closed) return;
          this.channel = null;
          this.connection = null;
          this.log('соединение закрыто, планирую переподключение');
          this.scheduleReconnect();
        });

        this.connection = connection;
        this.channel = channel;
        this.attempt = 0;
        this.log(`подключено к ${this.options.url}, exchange «${this.options.exchange}»`);

        for (const subscription of this.subscriptions) {
          await this.bind(subscription.queue, subscription.patterns, subscription.handler);
        }
      } catch (error) {
        this.log(`брокер недоступен (${(error as Error).message}), работаю без событий`);
        this.scheduleReconnect();
      } finally {
        this.connecting = null;
      }
    })();

    return this.connecting;
  }

  private scheduleReconnect(): void {
    if (this.closed || !this.options.enabled) return;
    this.attempt += 1;
    const delay = Math.min(1000 * 2 ** Math.min(this.attempt, 5), 30000);
    setTimeout(() => { void this.connect(); }, delay).unref?.();
  }

  /** Публикует событие. Возвращает false, если брокер недоступен. */
  async publish(type: string, payload: Record<string, unknown>): Promise<boolean> {
    const envelope: EventEnvelope = {
      eventId: randomUUID(),
      type,
      occurredAt: new Date().toISOString(),
      producer: this.options.producer,
      version: 1,
      payload,
    };
    if (!this.channel) {
      this.log(`событие ${type} не отправлено: нет соединения с брокером`);
      return false;
    }
    const ok = this.channel.publish(
      this.options.exchange,
      type,
      Buffer.from(JSON.stringify(envelope)),
      { persistent: true, contentType: 'application/json', messageId: envelope.eventId, type },
    );
    if (ok) this.log(`→ ${type} ${JSON.stringify(payload)}`);
    return ok;
  }

  /** Регистрирует потребителя. Привязка выполняется сразу либо после подключения. */
  async subscribe(queue: string, patterns: string[], handler: EventHandler): Promise<void> {
    this.subscriptions.push({ queue, patterns, handler });
    if (this.channel) await this.bind(queue, patterns, handler);
  }

  private async bind(queue: string, patterns: string[], handler: EventHandler): Promise<void> {
    const channel = this.channel;
    if (!channel) return;

    const dlq = `${queue}.dead`;
    await channel.assertQueue(dlq, { durable: true });
    await channel.bindQueue(dlq, this.options.exchange + DLX_SUFFIX, `${queue}.#`);
    await channel.assertQueue(queue, {
      durable: true,
      deadLetterExchange: this.options.exchange + DLX_SUFFIX,
      deadLetterRoutingKey: `${queue}.failed`,
    });
    for (const pattern of patterns) {
      await channel.bindQueue(queue, this.options.exchange, pattern);
    }
    await channel.prefetch(10);
    await channel.consume(queue, (message: ConsumeMessage | null) => {
      if (!message) return;
      void (async () => {
        try {
          const event = JSON.parse(message.content.toString()) as EventEnvelope;
          await handler(event);
          channel.ack(message);
          this.log(`← ${event.type} обработано`);
        } catch (error) {
          this.log(`ошибка обработки сообщения: ${(error as Error).message}`);
          // requeue=false: сообщение уходит в dead-letter-очередь, а не зацикливается
          channel.nack(message, false, false);
        }
      })();
    });
    this.log(`очередь «${queue}» слушает ${patterns.join(', ')}`);
  }

  async close(): Promise<void> {
    this.closed = true;
    try {
      await this.channel?.close();
      await this.connection?.close();
    } catch { /* уже закрыто */ }
    this.channel = null;
    this.connection = null;
  }
}
