import express, { ErrorRequestHandler, Express } from "express";
import cors from "cors";
import helmet from "helmet";
import { DataSource } from "typeorm";
import { ApiError, badRequest, conflict, notFound, unavailable } from "./errors";
import { asyncHandler } from "./async-handler";
import { listenHost } from "./config";

export const createApp = (service: string, database?: DataSource) => {
  const app = express();
  app.disable("x-powered-by");
  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: "64kb" }));
  app.use((req, _res, next) => { req.body ??= {}; next(); });
  app.get("/health", asyncHandler(async (_req, res) => {
    if (database) await database.query("SELECT 1");
    res.json({ status: "ok", service });
  }));
  return app;
};

export const finishApp = (app: Express) => {
  app.use((_req, _res, next) => next(notFound("Маршрут не найден.")));
  const errors: ErrorRequestHandler = (error, _req, res, _next) => {
    let apiError: ApiError;
    if (error instanceof ApiError) apiError = error;
    else if (error?.type === "entity.parse.failed") apiError = badRequest("Некорректный JSON.");
    else if (error?.type === "entity.too.large") apiError = new ApiError(413, "BAD_REQUEST", "Слишком большое тело запроса.");
    else if (error?.code === "SQLITE_CONSTRAINT") apiError = conflict();
    else if (error?.code === "SQLITE_BUSY") apiError = unavailable();
    else {
      console.error("Unhandled service error:", error?.name ?? "UnknownError");
      apiError = new ApiError(500, "INTERNAL_SERVER_ERROR", "Внутренняя ошибка сервера.");
    }
    res.status(apiError.statusCode).json({ error: { code: apiError.code, message: apiError.message,
      ...(apiError.details ? { details: apiError.details } : {}) } });
  };
  app.use(errors);
};

export const serve = (app: Express, port: number, service: string, database?: DataSource, cleanup?: () => Promise<void>) => {
  const host = listenHost();
  const server = app.listen(port, host, () => console.log(`${service}: http://${host}:${port}`));
  server.on("error", error => { console.error(`${service}: ${error.message}`); process.exitCode = 1; stop(); });
  let stopping = false;
  const stop = () => {
    if (stopping) return;
    stopping = true;
    const deadline = setTimeout(() => process.exit(1), 8000).unref();
    server.close(() => { void (async () => { await cleanup?.(); if (database?.isInitialized) await database.destroy(); clearTimeout(deadline); })(); });
    server.closeIdleConnections();
  };
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);
};
