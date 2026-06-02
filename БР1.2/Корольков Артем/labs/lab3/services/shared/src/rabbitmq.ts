import amqp, { type Channel, type Connection } from 'amqplib';
import { ALL_QUEUES } from './queues';

export const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost:5672';

let connection: Connection | null = null;
let channel: Channel | null = null;

export async function getRabbitChannel(): Promise<Channel> {
  if (channel) return channel;
  connection = await amqp.connect(RABBITMQ_URL);
  channel = await connection.createChannel();
  for (const name of ALL_QUEUES) {
    await channel.assertQueue(name, { durable: true });
  }
  return channel;
}

export function parseMessage<T>(content: Buffer): T {
  return JSON.parse(content.toString('utf8')) as T;
}

export function publishJson(queue: string, payload: unknown): void {
  if (!channel) throw new Error('RabbitMQ channel is not initialized');
  channel.sendToQueue(queue, Buffer.from(JSON.stringify(payload)), { persistent: true });
}
