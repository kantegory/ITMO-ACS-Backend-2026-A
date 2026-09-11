import "dotenv/config";
import { appDataSource } from "./data-source.js";
import { createApp } from "./app.js";
import { seedDemoData } from "./seed.js";

const port = Number(process.env.PORT ?? 3000);

await appDataSource.initialize();
await seedDemoData();
const server = createApp().listen(port, () => {
  console.log(`FitFlow monolith listening on http://localhost:${port}`);
});

async function shutdown(signal: string): Promise<void> {
  console.log(`Received ${signal}; shutting down`);
  server.close();
  if (appDataSource.isInitialized) await appDataSource.destroy();
  process.exit(0);
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
