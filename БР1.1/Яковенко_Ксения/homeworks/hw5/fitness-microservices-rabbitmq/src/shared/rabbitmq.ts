import amqp from 'amqplib';
import { envInt, envString } from './env';

export interface IntegrationEvent<
  TPayload extends Record<string, unknown> = Record<string, unknown>,
> {
  id: string;
  type: string;
  version: number;
  occurredAt: string;
  payload: TPayload;
}

const rabbitUrl = envString('RABBITMQ_URL', 'amqp://fitness:fitness@localhost:5672');
const exchangeName = envString('RABBITMQ_EXCHANGE', 'fitness.events');
const deadLetterExchangeName = envString('RABBITMQ_DEAD_LETTER_EXCHANGE', 'fitness.events.dlx');
const retryDelayMs = envInt('RABBITMQ_RETRY_DELAY_MS', 3000);

let publisherConnection: any | undefined;
let publisherChannel: any | undefined;
let publisherConnecting: Promise<any> | undefined;
let publisherConnected = false;
const consumerConnections = new Map<string, boolean>();

function sleep(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function resetPublisher(): void {
  publisherConnection = undefined;
  publisherChannel = undefined;
  publisherConnecting = undefined;
  publisherConnected = false;
}

async function createPublisherChannel(): Promise<any> {
  const connection = await amqp.connect(rabbitUrl);
  connection.on('error', (error: unknown) => {
    console.warn('RabbitMQ publisher connection error:', error);
  });
  connection.on('close', resetPublisher);

  const channel = await connection.createConfirmChannel();
  await channel.assertExchange(exchangeName, 'topic', { durable: true });
  await channel.assertExchange(deadLetterExchangeName, 'topic', { durable: true });

  publisherConnection = connection;
  publisherChannel = channel;
  publisherConnected = true;
  return channel;
}

async function ensurePublisherChannel(): Promise<any> {
  if (publisherChannel) return publisherChannel;
  if (!publisherConnecting) {
    publisherConnecting = createPublisherChannel().catch((error) => {
      resetPublisher();
      throw error;
    });
  }
  return publisherConnecting;
}

export async function publishIntegrationEvent(
  routingKey: string,
  event: IntegrationEvent,
): Promise<void> {
  const maxAttempts = 5;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const channel = await ensurePublisherChannel();
      channel.publish(exchangeName, routingKey, Buffer.from(JSON.stringify(event)), {
        persistent: true,
        contentType: 'application/json',
        contentEncoding: 'utf-8',
        messageId: event.id,
        type: event.type,
        timestamp: Date.parse(event.occurredAt),
      });
      await channel.waitForConfirms();
      return;
    } catch (error) {
      lastError = error;
      resetPublisher();
      console.warn(
        `RabbitMQ publish failed (${attempt}/${maxAttempts}), retrying in ${retryDelayMs} ms...`,
      );
      if (attempt < maxAttempts) await sleep(retryDelayMs);
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error('RabbitMQ publish failed after all attempts');
}

interface ConsumerOptions {
  queue: string;
  routingKey: string;
  consumerName: string;
  prefetch?: number;
  onEvent: (event: IntegrationEvent) => Promise<void>;
}

async function runConsumer(options: ConsumerOptions): Promise<void> {
  const deadLetterQueue = `${options.queue}.dlq`;
  const deadLetterRoutingKey = `${options.routingKey}.dead`;

  for (;;) {
    let connection: any | undefined;
    try {
      connection = await amqp.connect(rabbitUrl);
      connection.on('error', (error: unknown) => {
        console.warn(`${options.consumerName}: RabbitMQ connection error:`, error);
      });

      const channel = await connection.createChannel();
      await channel.assertExchange(exchangeName, 'topic', { durable: true });
      await channel.assertExchange(deadLetterExchangeName, 'topic', { durable: true });
      await channel.assertQueue(deadLetterQueue, { durable: true });
      await channel.bindQueue(deadLetterQueue, deadLetterExchangeName, deadLetterRoutingKey);
      await channel.assertQueue(options.queue, {
        durable: true,
        arguments: {
          'x-dead-letter-exchange': deadLetterExchangeName,
          'x-dead-letter-routing-key': deadLetterRoutingKey,
        },
      });
      await channel.bindQueue(options.queue, exchangeName, options.routingKey);
      await channel.prefetch(options.prefetch ?? 10);

      consumerConnections.set(options.consumerName, true);
      console.log(
        `${options.consumerName}: consuming queue ${options.queue} (${options.routingKey})`,
      );

      await channel.consume(
        options.queue,
        async (message: any | null) => {
          if (!message) return;
          try {
            const event = JSON.parse(message.content.toString('utf-8')) as IntegrationEvent;
            if (!event.id || !event.type || !event.payload) {
              throw new Error('Integration event has an invalid envelope');
            }
            await options.onEvent(event);
            channel.ack(message);
          } catch (error) {
            console.error(`${options.consumerName}: event processing failed:`, error);
            channel.nack(message, false, false);
          }
        },
        { noAck: false },
      );

      await new Promise<void>((resolve) => {
        connection.once('close', resolve);
      });
    } catch (error) {
      console.warn(
        `${options.consumerName}: RabbitMQ is unavailable, retrying in ${retryDelayMs} ms...`,
        error,
      );
    } finally {
      consumerConnections.set(options.consumerName, false);
      if (connection) {
        try {
          await connection.close();
        } catch {
          // The connection may already be closed.
        }
      }
    }

    await sleep(retryDelayMs);
  }
}

export function startRabbitConsumer(options: ConsumerOptions): void {
  void runConsumer(options);
}

export function rabbitMqStatus(): {
  publisherConnected: boolean;
  consumers: Record<string, boolean>;
} {
  return {
    publisherConnected,
    consumers: Object.fromEntries(consumerConnections.entries()),
  };
}
