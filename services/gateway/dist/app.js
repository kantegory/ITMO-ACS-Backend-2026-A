"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = createApp;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const http_proxy_middleware_1 = require("http-proxy-middleware");
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const yamljs_1 = __importDefault(require("yamljs"));
const env_1 = require("./config/env");
function createApp() {
    const app = (0, express_1.default)();
    app.use((0, cors_1.default)({
        origin: env_1.env.allowedOrigins,
        credentials: true,
    }));
    app.get("/health", (_req, res) => res.json({ status: "ok", service: "gateway" }));
    const openapiPath = process.env.OPENAPI_PATH ||
        path_1.default.join(process.cwd(), "..", "..", "api", "openapi.yaml");
    const openapiDoc = yamljs_1.default.load(openapiPath);
    app.use("/api-docs", swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(openapiDoc));
    const authProxy = (0, http_proxy_middleware_1.createProxyMiddleware)({
        target: env_1.env.authServiceUrl,
        changeOrigin: true,
    });
    const profileProxy = (0, http_proxy_middleware_1.createProxyMiddleware)({
        target: env_1.env.profileServiceUrl,
        changeOrigin: true,
    });
    const vacancyProxy = (0, http_proxy_middleware_1.createProxyMiddleware)({
        target: env_1.env.vacancyServiceUrl,
        changeOrigin: true,
    });
    app.use("/api/v1/auth", authProxy);
    app.get("/api/v1/me", authProxy);
    app.use("/api/v1/me", profileProxy);
    app.use("/api/v1/vacancies", vacancyProxy);
    app.use("/api/v1/employer", vacancyProxy);
    return app;
}
