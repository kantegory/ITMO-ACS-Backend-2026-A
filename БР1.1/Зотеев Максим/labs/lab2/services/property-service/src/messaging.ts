import { keepBrokerConnection } from "@rental/shared";
import amqplib, { Channel } from "amqplib";
import { config } from "./config";

const EXCHANGE = "rental.events";

let channel: Channel | null = null;

// Publishing is fire-and-forget here, so the HTTP API starts and keeps serving without the broker.
export const connectRabbit = async () => {
  keepBrokerConnection(async () => {
    const connection = await amqplib.connect(config.rabbitmqUrl);
    connection.on("error", () => undefined);
    try {
      const ch = await connection.createChannel();
      await ch.assertExchange(EXCHANGE, "topic", { durable: true });
      ch.once("close", () => {
        if (channel === ch) channel = null;
        connection.close().catch(() => undefined); // a lone channel failure must not leak the connection
      });
      channel = ch;
      return [connection, ch];
    } catch (e) {
      await connection.close().catch(() => undefined);
      throw e;
    }
  });
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
