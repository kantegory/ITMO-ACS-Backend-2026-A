import amqp from "amqplib";
import { env } from "../config/env";
import { ProfileService } from "../services/profile.service";

const EXCHANGE = "vacancies.events";
const QUEUE = "profile.user-registered";

export async function startConsumer(): Promise<void> {
  const conn = await amqp.connect(env.rabbitmqUrl);
  const channel = await conn.createChannel();

  await channel.assertExchange(EXCHANGE, "topic", { durable: true });
  await channel.assertQueue(QUEUE, { durable: true });
  await channel.bindQueue(QUEUE, EXCHANGE, "user.registered");

  channel.consume(QUEUE, async (msg) => {
    if (!msg) return;
    try {
      const event = JSON.parse(msg.content.toString());
      const payload = event.payload;
      if (payload?.role === "candidate" && payload?.user_id) {
        await ProfileService.ensureProfile(payload.user_id);
      }
      channel.ack(msg);
    } catch (err) {
      console.error("Failed to process user.registered:", err);
      channel.nack(msg, false, false);
    }
  });

  console.log("Profile consumer listening on", QUEUE);
}
