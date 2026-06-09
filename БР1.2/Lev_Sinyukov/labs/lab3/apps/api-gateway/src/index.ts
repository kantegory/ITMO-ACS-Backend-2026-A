import dotenv from "dotenv";
import express from "express";
import {
  buildError,
  buildHealth,
  connectRabbit,
  createRpcClient,
  parseRpcResult,
  ReservationAvailabilityRequest,
  ReservationAvailabilityResponse,
  RestaurantSearchRequest,
  RestaurantSearchResponse,
  ReviewSummaryResponse,
} from "@app/shared";

dotenv.config();

async function bootstrap() {
  const app = express();
  app.use(express.json());

  const port = Number(process.env.PORT ?? 8080);
  const serviceName = process.env.SERVICE_NAME ?? "api-gateway";
  const { connection, channel } = await connectRabbit(serviceName);
  const rpcClient = await createRpcClient(channel, "api-gateway.rpc.responses");

  app.get("/health", (_req, res) => {
    res.json(buildHealth(serviceName));
  });

  app.get("/api/v1/info", (_req, res) => {
    res.json({
      service: serviceName,
      description: "Gateway for queue-based restaurant booking microservices",
      broker: "RabbitMQ",
    });
  });

  app.get("/api/v1/restaurants", async (req, res) => {
    try {
      const payload: RestaurantSearchRequest = {
        name: typeof req.query.name === "string" ? req.query.name : undefined,
        cuisine: typeof req.query.cuisine === "string" ? req.query.cuisine : undefined,
        city: typeof req.query.city === "string" ? req.query.city : undefined,
        min_price_range: typeof req.query.min_price_range === "string" ? Number(req.query.min_price_range) : undefined,
        max_price_range: typeof req.query.max_price_range === "string" ? Number(req.query.max_price_range) : undefined,
      };

      const response = parseRpcResult(
        await rpcClient.request<RestaurantSearchRequest, RestaurantSearchResponse>(
          "catalog.restaurants.search.request",
          payload,
        ),
      );

      res.json(response);
    } catch (error) {
      console.error("Restaurant search RPC error:", error);
      res.status(503).json(buildError("SERVICE_UNAVAILABLE", "Catalog service is unavailable"));
    }
  });

  app.get("/api/v1/restaurants/:restaurantId/reviews/summary", async (req, res) => {
    const restaurantId = Number(req.params.restaurantId);
    if (!Number.isInteger(restaurantId) || restaurantId <= 0) {
      return res.status(400).json(buildError("VALIDATION_ERROR", "Invalid restaurantId"));
    }

    try {
      const response = parseRpcResult(
        await rpcClient.request<{ restaurant_id: number }, ReviewSummaryResponse>(
          "review.summary.request",
          { restaurant_id: restaurantId },
        ),
      );

      return res.json(response);
    } catch (error) {
      console.error("Review summary RPC error:", error);
      return res.status(503).json(buildError("SERVICE_UNAVAILABLE", "Review service is unavailable"));
    }
  });

  app.post("/api/v1/reservations/availability-check", async (req, res) => {
    const payload = req.body as Partial<ReservationAvailabilityRequest>;

    try {
      const response = parseRpcResult(
        await rpcClient.request<Partial<ReservationAvailabilityRequest>, ReservationAvailabilityResponse>(
          "reservation.availability.request",
          payload,
        ),
      );

      return res.json(response);
    } catch (error) {
      console.error("Reservation availability RPC error:", error);
      return res.status(503).json(buildError("SERVICE_UNAVAILABLE", "Reservation workflow is unavailable"));
    }
  });

  app.use((_req, res) => {
    res.status(404).json(buildError("NOT_FOUND", "Route not found"));
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
  console.error("[api-gateway] failed to start", error);
  process.exit(1);
});
