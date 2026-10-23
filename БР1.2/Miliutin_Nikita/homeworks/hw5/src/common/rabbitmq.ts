import amqp, { Channel } from "amqplib";
import { EXCHANGE_NAME } from "./events";

const RABBITMQ_URL = process.env.RABBITMQ_URL || "amqp://guest:guest@localhost:5672";

export interface RabbitConnection {
  connection: Awaited<ReturnType<typeof amqp.connect>>;
  channel: Channel;
}

export const connectRabbit = async (): Promise<RabbitConnection> => {
  const connection = await amqp.connect(RABBITMQ_URL);
  const channel = await connection.createChannel();

  await channel.assertExchange(EXCHANGE_NAME, "topic", { durable: true });

  return { connection, channel };
};

export const publishJson = (
  channel: Channel,
  routingKey: string,
  payload: unknown
): boolean => {
  return channel.publish(EXCHANGE_NAME, routingKey, Buffer.from(JSON.stringify(payload)), {
    contentType: "application/json",
    deliveryMode: 2,
    timestamp: Date.now()
  });
};
