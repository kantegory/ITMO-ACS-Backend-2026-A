import { readFileSync } from "node:fs";
import type { RequestHandler } from "express";

export function databaseOptions() {
  const caFile = process.env.DB_CA_FILE;
  return {
    synchronize: process.env.DB_SYNCHRONIZE !== "false",
    ssl: caFile ? { ca: readFileSync(caFile, "utf8"), rejectUnauthorized: true } : undefined,
  };
}

export function databaseReadiness(db: { query(sql: string): Promise<unknown> }): RequestHandler {
  return async (_req, res) => {
    try {
      await db.query("SELECT 1");
      res.sendStatus(200);
    } catch {
      res.sendStatus(503);
    }
  };
}
