import "dotenv/config";
import { createApp } from "./app.js";
import { dataSource } from "./data-source.js";

const port = Number(process.env.PORT ?? 3002);
await dataSource.initialize();
const server = createApp().listen(port, () => console.log(`workout service listening on ${port}`));
async function shutdown() {
  server.close();
  if (dataSource.isInitialized) await dataSource.destroy();
  process.exit(0);
}
process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);
