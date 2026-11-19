import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { authRouter } from "./routes/auth.routes";
import { cuisinesRouter } from "./routes/cuisines.routes";
import { reservationsRouter } from "./routes/reservations.routes";
import { restaurantsRouter } from "./routes/restaurants.routes";
import { usersRouter } from "./routes/users.routes";
import { errorHandler } from "./middleware/error-handler";
import { notFound } from "./errors";

export const createApp = () => {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json());
  app.use(morgan("dev"));

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/auth", authRouter);
  app.use("/users", usersRouter);
  app.use("/restaurants", restaurantsRouter);
  app.use("/cuisines", cuisinesRouter);
  app.use("/reservations", reservationsRouter);

  app.use((_req, _res, next) => {
    next(notFound("Маршрут не найден."));
  });

  app.use(errorHandler);

  return app;
};
