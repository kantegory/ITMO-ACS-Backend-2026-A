"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const shared_1 = require("@hw5/shared");
dotenv_1.default.config();
const users = [
    { id: 1, email: "user1@example.com", is_active: true },
    { id: 2, email: "user2@example.com", is_active: true },
    { id: 3, email: "blocked@example.com", is_active: false },
];
async function bootstrap() {
    const app = (0, express_1.default)();
    app.use(express_1.default.json());
    const port = Number(process.env.PORT ?? 8081);
    const serviceName = process.env.SERVICE_NAME ?? "identity-service";
    const { connection, channel } = await (0, shared_1.connectRabbit)(serviceName);
    await (0, shared_1.registerRpcHandler)(channel, "identity.user.validate.queue", "identity.user.validate.request", async ({ user_id }) => {
        const user = users.find((item) => item.id === Number(user_id));
        return {
            ok: true,
            exists: Boolean(user),
            is_active: Boolean(user?.is_active),
            email: user?.email,
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
    console.error("[identity-service] failed to start", error);
    process.exit(1);
});
