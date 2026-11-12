import amqplib from "amqplib";

let connection: Awaited<ReturnType<typeof amqplib.connect>> | null = null;
let ch: amqplib.Channel | null = null;

export async function getPublisherChannel(): Promise<amqplib.Channel> {
  if (ch) return ch;
  const url = process.env.AMQP_URL || "amqp://localhost:5672";
  connection = await amqplib.connect(url);
  ch = await connection.createChannel();
  const exchange = process.env.BOOKING_EVENTS_EXCHANGE || "booking_events";
  await ch.assertExchange(exchange, "fanout", { durable: true });
  return ch;
}

export async function publishBookingCreated(payload: Record<string, unknown>): Promise<void> {
  const exchange = process.env.BOOKING_EVENTS_EXCHANGE || "booking_events";
  const channel = await getPublisherChannel();
  channel.publish(exchange, "", Buffer.from(JSON.stringify(payload)), { persistent: true });
}
