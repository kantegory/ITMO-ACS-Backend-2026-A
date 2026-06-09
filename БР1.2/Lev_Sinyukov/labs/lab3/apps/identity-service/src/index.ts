import dotenv from "dotenv";
import express from "express";
import {
  buildHealth,
  connectRabbit,
  registerRpcHandler,
  UserValidationRequest,
  UserValidationResponse,
} from "@app/shared";

dotenv.config();

const users = [
  { id: 1, email: "user1@example.com", is_active: true },
  { id: 2, email: "user2@example.com", is_active: true },
  { id: 3, email: "blocked@example.com", is_active: false },
];

async function bootstrap() {
  const app = express();
  app.use(express.json());

  const port = Number(process.env.PORT ?? 8081);
  const serviceName = process.env.SERVICE_NAME ?? "identity-service";
  const { connection, channel } = await connectRabbit(serviceName);

  await registerRpcHandler<UserValidationRequest, UserValidationResponse>(
    channel,
    "identity.user.validate.queue",
    "identity.user.validate.request",
    async ({ user_id }: UserValidationRequest) => {
      const user = users.find((item) => item.id === Number(user_id));
      return {
        ok: true,
        exists: Boolean(user),
        is_active: Boolean(user?.is_active),
        email: user?.email,
      };
    },
  );

  app.get("/health", (_req, res) => {
    res.json(buildHealth(serviceName));
  });

  process.on("SIGINT", async () => {
    await connection.close();
    process.exit(0);
  });

  app.listen(port, () => {
    console.log(`[${serviceName}] listening on port ${port}`);
  });
}

bootstrap().catch((error) => {
  console.error("[identity-service] failed to start", error);
  process.exit(1);
});
