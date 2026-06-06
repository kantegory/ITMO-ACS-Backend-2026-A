import cors from "cors";
import express, { type Express } from "express";

export function createApp(): Express {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.get("/health", (_req, res) => res.json({ status: "ok", service: process.env.SERVICE_NAME ?? "unknown" }));
  return app;
}

export function listen(app: Express, defaultPort: number, label: string): void {
  const port = Number(process.env.PORT ?? defaultPort);
  app.listen(port, () => console.log(`${label} http://localhost:${port}`));
}
