import amqp, { Channel } from "amqplib";
import { EXCHANGE_NAME } from "./events";

const RABBITMQ_URL = process.env.RABBITMQ_URL || "amqp://guest:guest@rabbitmq:5672";

export const connectRabbit = async (): Promise<Channel> => {
  const connection = await amqp.connect(RABBITMQ_URL);
  const channel = await connection.createChannel();
  await channel.assertExchange(EXCHANGE_NAME, "topic", { durable: true });
  return channel;
};

export const publishJson = (channel: Channel, routingKey: string, payload: unknown): boolean =>
  channel.publish(EXCHANGE_NAME, routingKey, Buffer.from(JSON.stringify(payload)), {
    contentType: "application/json",
    deliveryMode: 2,
    timestamp: Date.now()
  });
