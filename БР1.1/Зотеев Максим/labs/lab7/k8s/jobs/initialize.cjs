const { createRequire } = require("node:module");
const fs = require("node:fs");
const amqp = createRequire("/app/services/messaging-service/package.json")("amqplib");

async function initialize() {
  for (const name of ["identity", "property", "rental", "messaging"]) {
    process.env.DB_NAME = name;
    process.env.DB_USER = name;
    process.env.DB_PASSWORD = fs.readFileSync("/roles/" + name, "utf8");
    const source = "/app/services/" + name + "-service/dist/";
    const { AppDataSource } = require(source + "data-source.js");
    await AppDataSource.initialize();
    await AppDataSource.synchronize();
    if (name === "property") await require(source + "seed.js").seed();
    if (name === "rental") await AppDataSource.query(fs.readFileSync("/app/services/rental-service/outbox/outbox.sql", "utf8"));
    await AppDataSource.destroy();
  }
  const conn = await amqp.connect(process.env.RABBITMQ_URL);
  const channel = await conn.createChannel();
  await channel.assertExchange("rental.events", "topic", { durable: true });
  await channel.assertExchange("rental.failed", "fanout", { durable: true });
  await channel.assertQueue("messaging.failed", { durable: true });
  await channel.bindQueue("messaging.failed", "rental.failed", "");
  await channel.assertQueue("messaging.rental-events", { durable: true });
  await channel.bindQueue("messaging.rental-events", "rental.events", "rental.*");
  await conn.close();
  console.log("Four schemas, property reference data, outbox trigger and queue bindings ready");
}
initialize().catch((error) => { console.error(error.message); process.exit(1); });
