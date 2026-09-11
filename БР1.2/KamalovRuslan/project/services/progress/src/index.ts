import "dotenv/config";
import { createApp } from "./app.js";
import { dataSource } from "./data-source.js";
import { startConsumer, stopConsumer } from "./events.js";

const port = Number(process.env.PORT ?? 3003);
await dataSource.initialize();
await startConsumer();
const server = createApp().listen(port, () => console.log(`progress service listening on ${port}`));
async function shutdown() {
  server.close();
  await stopConsumer();
  if (dataSource.isInitialized) await dataSource.destroy();
  process.exit(0);
}
process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);
