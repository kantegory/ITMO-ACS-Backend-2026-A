"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const shared_1 = require("@hw5/shared");
dotenv_1.default.config();
const summaries = new Map([
    [1, { average_rating: 4.6, reviews_count: 18 }],
    [2, { average_rating: 4.8, reviews_count: 24 }],
    [3, { average_rating: 3.9, reviews_count: 7 }],
]);
async function bootstrap() {
    const app = (0, express_1.default)();
    app.use(express_1.default.json());
    const port = Number(process.env.PORT ?? 8084);
    const serviceName = process.env.SERVICE_NAME ?? "review-service";
    const { connection, channel } = await (0, shared_1.connectRabbit)(serviceName);
    await (0, shared_1.registerRpcHandler)(channel, "review.summary.queue", "review.summary.request", async ({ restaurant_id }) => {
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
    });
    app.get("/health", (_req, res) => {
        res.json((0, shared_1.buildHealth)(serviceName));
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
