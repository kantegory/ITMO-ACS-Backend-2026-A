import amqp from "amqplib";
import { env } from "../config/env";

const EXCHANGE = "vacancies.events";

export type UserRegisteredPayload = {
  user_id: string;
  role: string;
  full_name: string;
  email: string;
};

export async function publishUserRegistered(payload: UserRegisteredPayload): Promise<void> {
  const conn = await amqp.connect(env.rabbitmqUrl);
  try {
    const channel = await conn.createChannel();
    await channel.assertExchange(EXCHANGE, "topic", { durable: true });
    const message = {
      event: "user.registered",
      timestamp: new Date().toISOString(),
      payload,
    };
    channel.publish(
      EXCHANGE,
      "user.registered",
      Buffer.from(JSON.stringify(message)),
      { persistent: true },
    );
    await channel.close();
  } finally {
    await conn.close();
  }
}
