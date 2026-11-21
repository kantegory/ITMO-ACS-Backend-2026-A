"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const shared_1 = require("@hw5/shared");
dotenv_1.default.config();
async function bootstrap() {
    const app = (0, express_1.default)();
    app.use(express_1.default.json());
    const port = Number(process.env.PORT ?? 8080);
    const serviceName = process.env.SERVICE_NAME ?? "api-gateway";
    const { connection, channel } = await (0, shared_1.connectRabbit)(serviceName);
    const rpcClient = await (0, shared_1.createRpcClient)(channel, "api-gateway.rpc.responses");
    app.get("/health", (_req, res) => {
        res.json((0, shared_1.buildHealth)(serviceName));
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
            const payload = {
                name: typeof req.query.name === "string" ? req.query.name : undefined,
                cuisine: typeof req.query.cuisine === "string" ? req.query.cuisine : undefined,
                city: typeof req.query.city === "string" ? req.query.city : undefined,
                min_price_range: typeof req.query.min_price_range === "string" ? Number(req.query.min_price_range) : undefined,
                max_price_range: typeof req.query.max_price_range === "string" ? Number(req.query.max_price_range) : undefined,
            };
            const response = (0, shared_1.parseRpcResult)(await rpcClient.request("catalog.restaurants.search.request", payload));
            res.json(response);
        }
        catch (error) {
            console.error("Restaurant search RPC error:", error);
            res.status(503).json((0, shared_1.buildError)("SERVICE_UNAVAILABLE", "Catalog service is unavailable"));
        }
    });
    app.get("/api/v1/restaurants/:restaurantId/reviews/summary", async (req, res) => {
        const restaurantId = Number(req.params.restaurantId);
        if (!Number.isInteger(restaurantId) || restaurantId <= 0) {
            return res.status(400).json((0, shared_1.buildError)("VALIDATION_ERROR", "Invalid restaurantId"));
        }
        try {
            const response = (0, shared_1.parseRpcResult)(await rpcClient.request("review.summary.request", { restaurant_id: restaurantId }));
            return res.json(response);
        }
        catch (error) {
            console.error("Review summary RPC error:", error);
            return res.status(503).json((0, shared_1.buildError)("SERVICE_UNAVAILABLE", "Review service is unavailable"));
        }
    });
    app.post("/api/v1/reservations/availability-check", async (req, res) => {
        const payload = req.body;
        try {
            const response = (0, shared_1.parseRpcResult)(await rpcClient.request("reservation.availability.request", payload));
            return res.json(response);
        }
        catch (error) {
            console.error("Reservation availability RPC error:", error);
            return res.status(503).json((0, shared_1.buildError)("SERVICE_UNAVAILABLE", "Reservation workflow is unavailable"));
        }
    });
    app.use((_req, res) => {
        res.status(404).json((0, shared_1.buildError)("NOT_FOUND", "Route not found"));
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
