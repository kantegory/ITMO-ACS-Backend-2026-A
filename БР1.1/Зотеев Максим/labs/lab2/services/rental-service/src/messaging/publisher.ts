import { keepBrokerConnection } from "@rental/shared";
import amqplib, { Channel } from "amqplib";
import { config } from "../config";

export const EXCHANGE = "rental.events";

// With RENTAL_OUTBOX=true a database trigger records events and outbox/relay.cjs publishes
// them, so this service does not talk to the broker at all.
const outbox = () => process.env.RENTAL_OUTBOX === "true";

let channel: Channel | null = null;

export const connectRabbit = async () => {
  if (outbox()) return;
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
  if (outbox()) return;
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
