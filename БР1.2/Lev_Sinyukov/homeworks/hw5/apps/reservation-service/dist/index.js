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
    const port = Number(process.env.PORT ?? 8083);
    const serviceName = process.env.SERVICE_NAME ?? "reservation-service";
    const { connection, channel } = await (0, shared_1.connectRabbit)(serviceName);
    const rpcClient = await (0, shared_1.createRpcClient)(channel, "reservation-service.rpc.responses");
    await channel.assertQueue("reservation.audit.queue", { durable: false });
    await channel.bindQueue("reservation.audit.queue", shared_1.EXCHANGE_NAME, "reservation.audit.event");
    const publishAudit = (status, reason, payload) => {
        channel.publish(shared_1.EXCHANGE_NAME, "reservation.audit.event", Buffer.from(JSON.stringify({
            event: "reservation.availability.checked",
            status,
            reason,
            payload,
            checked_at: new Date().toISOString(),
        })), { contentType: "application/json" });
    };
    await (0, shared_1.registerRpcHandler)(channel, "reservation.availability.queue", "reservation.availability.request", async (payload) => {
        const { user_id, restaurant_id, table_id, reservation_start, reservation_end, guests_count } = payload;
        if (!user_id || !restaurant_id || !table_id || !reservation_start || !reservation_end || !guests_count) {
            throw new Error("Missing required reservation fields");
        }
        const start = new Date(reservation_start);
        const end = new Date(reservation_end);
        if (Number.isNaN(start.valueOf()) || Number.isNaN(end.valueOf()) || start >= end) {
            publishAudit("rejected", "INVALID_TIME_RANGE", payload);
            return {
                ok: true,
                available: false,
                reason: "INVALID_TIME_RANGE",
            };
        }
        const user = (0, shared_1.parseRpcResult)(await rpcClient.request("identity.user.validate.request", { user_id }));
        if (!user.exists) {
            publishAudit("rejected", "USER_NOT_FOUND", payload);
            return {
                ok: true,
                available: false,
                reason: "USER_NOT_FOUND",
            };
        }
        if (!user.is_active) {
            publishAudit("rejected", "USER_INACTIVE", payload);
            return {
                ok: true,
                available: false,
                reason: "USER_INACTIVE",
            };
        }
        const table = (0, shared_1.parseRpcResult)(await rpcClient.request("catalog.table.validate.request", { restaurant_id, table_id, guests_count }));
        if (!table.exists) {
            publishAudit("rejected", "TABLE_NOT_FOUND", payload);
            return {
                ok: true,
                available: false,
                reason: "TABLE_NOT_FOUND",
            };
        }
        if (!table.is_active) {
            publishAudit("rejected", "TABLE_INACTIVE", payload);
            return {
                ok: true,
                available: false,
                reason: "TABLE_INACTIVE",
            };
        }
        if (Number(guests_count) > table.seats_count) {
            publishAudit("rejected", "CAPACITY_EXCEEDED", payload);
            return {
                ok: true,
                available: false,
                reason: "CAPACITY_EXCEEDED",
            };
        }
        publishAudit("accepted", "OK", payload);
        return {
            ok: true,
            available: true,
            reason: "OK",
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
    console.error("[reservation-service] failed to start", error);
    process.exit(1);
});
