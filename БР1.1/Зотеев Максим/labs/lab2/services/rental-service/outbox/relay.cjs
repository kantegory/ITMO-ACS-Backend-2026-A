const fs = require("node:fs");
const { Client } = require("pg");
const amqp = require("amqplib");
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const fail = (message) => { console.error(message); process.exit(1); };

// The liveness probe checks that this file was touched recently, so a relay stuck on the
// database or the broker gets restarted instead of silently holding the outbox lock.
const HEARTBEAT = process.env.RELAY_HEARTBEAT_FILE || "/tmp/relay-heartbeat";
const CONFIRM_TIMEOUT_MS = 15000;

async function confirmed(channel) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error("RabbitMQ did not confirm the event in time")), CONFIRM_TIMEOUT_MS);
  });
  try {
    await Promise.race([channel.waitForConfirms(), timeout]);
  } finally {
    clearTimeout(timer);
  }
}

async function relay() {
  const db = new Client({
    host: process.env.DB_HOST, port: Number(process.env.DB_PORT),
    user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME || "rental",
    ssl: { ca: fs.readFileSync(process.env.DB_CA_FILE), rejectUnauthorized: true },
    statement_timeout: 30000, // above CONFIRM_TIMEOUT_MS: the standby replica may wait on the row lock
  });
  db.on("error", (error) => fail("PostgreSQL connection failed: " + error.message));
  await db.connect();
  const connection = await amqp.connect(process.env.RABBITMQ_URL);
  connection.on("error", (error) => console.error("RabbitMQ error:", error.message));
  connection.on("close", () => fail("RabbitMQ connection closed"));
  const channel = await connection.createConfirmChannel();
  channel.on("close", () => fail("RabbitMQ channel closed"));
  channel.on("return", () => fail("Unroutable event")); // The event stays in the outbox.
  for (;;) {
    fs.writeFileSync(HEARTBEAT, String(Date.now()));
    await db.query("BEGIN");
    // A second replica waits on this row lock and takes over if the first one dies.
    const { rows } = await db.query("SELECT * FROM rental_outbox ORDER BY seq LIMIT 1 FOR UPDATE");
    if (rows.length) {
      const e = rows[0];
      channel.publish("rental.events", e.routing_key, Buffer.from(JSON.stringify(e.payload)), {
        persistent: true, mandatory: true, messageId: e.event_id, contentType: "application/json",
      });
      await confirmed(channel);
      await db.query("DELETE FROM rental_outbox WHERE seq=$1", [e.seq]);
    }
    await db.query("COMMIT");
    if (!rows.length) await delay(150);
  }
}
relay().catch((error) => fail(error.message));
