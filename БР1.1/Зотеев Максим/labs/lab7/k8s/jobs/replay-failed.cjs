// Moves dead-lettered rental events from messaging.failed back to rental.events.
// The consumer ignores duplicates by event ID, so replaying an event twice is harmless.
const { createRequire } = require("node:module");
const amqp = createRequire("/app/services/messaging-service/package.json")("amqplib");

async function replay() {
  const conn = await amqp.connect(process.env.RABBITMQ_URL);
  const channel = await conn.createConfirmChannel();
  let moved = 0;
  for (;;) {
    const msg = await channel.get("messaging.failed", { noAck: false });
    if (!msg) break;
    // Drop broker-set x-death / x-delivery-count headers so the event starts with fresh retries.
    const headers = Object.fromEntries(Object.entries(msg.properties.headers ?? {}).filter(([key]) => !key.startsWith("x-")));
    channel.publish("rental.events", msg.fields.routingKey, msg.content, {
      ...msg.properties, headers, persistent: true, mandatory: true,
    });
    await channel.waitForConfirms();
    channel.ack(msg);
    moved += 1;
  }
  await conn.close();
  console.log(`Re-published ${moved} event(s) from messaging.failed`);
}
replay().catch((error) => { console.error(error.message); process.exit(1); });
