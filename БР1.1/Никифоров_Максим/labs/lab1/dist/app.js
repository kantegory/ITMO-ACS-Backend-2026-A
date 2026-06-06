"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = createApp;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const path_1 = __importDefault(require("path"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const yamljs_1 = __importDefault(require("yamljs"));
const env_1 = require("./config/env");
const routes_1 = __importDefault(require("./routes"));
const errorHandler_1 = require("./middleware/errorHandler");
function createApp() {
    const app = (0, express_1.default)();
    app.use((0, cors_1.default)({
        origin: env_1.env.allowedOrigins,
        credentials: true,
    }));
    app.use(express_1.default.json());
    app.use((0, cookie_parser_1.default)());
    app.get("/health", (_req, res) => res.json({ status: "ok" }));
    const openapiPath = path_1.default.join(process.cwd(), "api", "openapi.yaml");
    const openapiDoc = yamljs_1.default.load(openapiPath);
    app.use("/api-docs", swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(openapiDoc));
    app.use("/api/v1", routes_1.default);
    app.use(errorHandler_1.errorHandler);
    return app;
}
