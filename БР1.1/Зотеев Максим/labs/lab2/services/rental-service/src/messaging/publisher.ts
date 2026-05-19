import amqplib, { Channel, ChannelModel } from "amqplib";
import { config } from "../config";

export const EXCHANGE = "rental.events";

let connection: ChannelModel | null = null;
let channel: Channel | null = null;

export const connectRabbit = async () => {
  for (let attempt = 1; attempt <= 10; attempt++) {
    try {
      connection = await amqplib.connect(config.rabbitmqUrl);
      channel = await connection.createChannel();
      await channel.assertExchange(EXCHANGE, "topic", { durable: true });
      console.log("RabbitMQ connected");
      return;
    } catch (e) {
      console.warn(`RabbitMQ connect attempt ${attempt} failed:`, (e as Error).message);
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
  throw new Error("Failed to connect to RabbitMQ after retries");
};

export const publishEvent = (routingKey: string, payload: unknown) => {
  if (!channel) {
    console.warn(`RabbitMQ channel is not ready, dropping event ${routingKey}`);
    return;
  }
  const body = Buffer.from(JSON.stringify(payload));
  channel.publish(EXCHANGE, routingKey, body, {
    contentType: "application/json",
    persistent: true,
    timestamp: Date.now(),
  });
};
