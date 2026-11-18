const fs = require("node:fs");
const { Client } = require("pg");
const amqp = require("amqplib");
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function relay() {
  const db = new Client({
    host: process.env.DB_HOST, port: Number(process.env.DB_PORT),
    user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: "rental",
    ssl: { ca: fs.readFileSync(process.env.DB_CA_FILE), rejectUnauthorized: true },
  });
  await db.connect();
  const connection = await amqp.connect(process.env.RABBITMQ_URL);
  connection.on("close", () => process.exit(1));
  const channel = await connection.createConfirmChannel();
  channel.on("close", () => process.exit(1));
  channel.on("return", () => process.exit(1)); // Unroutable events stay in the transaction.
  for (;;) {
    await db.query("BEGIN");
    const { rows } = await db.query("SELECT * FROM rental_outbox ORDER BY seq LIMIT 1 FOR UPDATE");
    if (rows.length) {
      const e = rows[0];
      channel.publish("rental.events", e.routing_key, Buffer.from(JSON.stringify(e.payload)), {
        persistent: true, mandatory: true, messageId: e.event_id, contentType: "application/json",
      });
      await channel.waitForConfirms();
      await db.query("DELETE FROM rental_outbox WHERE seq=$1", [e.seq]);
    }
    await db.query("COMMIT");
    if (!rows.length) await delay(150);
  }
}
relay().catch((error) => { console.error(error.message); process.exit(1); });
