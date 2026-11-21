import dotenv from "dotenv";
import express from "express";
import {
  buildHealth,
  connectRabbit,
  registerRpcHandler,
  ReviewSummaryRequest,
  ReviewSummaryResponse,
} from "@hw5/shared";

dotenv.config();

const summaries = new Map<number, { average_rating: number; reviews_count: number }>([
  [1, { average_rating: 4.6, reviews_count: 18 }],
  [2, { average_rating: 4.8, reviews_count: 24 }],
  [3, { average_rating: 3.9, reviews_count: 7 }],
]);

async function bootstrap() {
  const app = express();
  app.use(express.json());

  const port = Number(process.env.PORT ?? 8084);
  const serviceName = process.env.SERVICE_NAME ?? "review-service";
  const { connection, channel } = await connectRabbit(serviceName);

  await registerRpcHandler<ReviewSummaryRequest, ReviewSummaryResponse>(
    channel,
    "review.summary.queue",
    "review.summary.request",
    async ({ restaurant_id }: ReviewSummaryRequest) => {
      const summary = summaries.get(Number(restaurant_id)) ?? {
        average_rating: 0,
        reviews_count: 0,
      };

      return {
        ok: true,
        restaurant_id: Number(restaurant_id),
        average_rating: summary.average_rating,
        reviews_count: summary.reviews_count,
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
  console.error("[review-service] failed to start", error);
  process.exit(1);
});
