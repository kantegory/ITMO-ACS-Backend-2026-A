import "reflect-metadata";
import { port, required } from "../shared/config";
import { createApp, finishApp, serve } from "../shared/server";
import { requireService } from "../shared/auth";
import { AppDataSource } from "./data-source";
import { authRouter } from "./routes/auth.routes";
import { usersRouter } from "./routes/users.routes";
import { requireAuth } from "./middleware/auth";

const main = async () => {
  if (required("JWT_SECRET").length < 32 || required("SERVICE_KEY").length < 32) throw new Error("Secrets must contain at least 32 characters");
  await AppDataSource.initialize();
  const app = createApp("accounts", AppDataSource);
  app.use("/auth", authRouter);
  app.use("/users", usersRouter);
  app.get("/internal/auth/verify", requireService, requireAuth, (req, res) => res.json(req.user));
  finishApp(app);
  serve(app, port("ACCOUNTS_PORT", 8081), "accounts", AppDataSource);
};
main().catch(error => { console.error(error.message); process.exit(1); });
