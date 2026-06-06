"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = createApp;
const express_1 = __importDefault(require("express"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const errorHandler_1 = require("./middleware/errorHandler");
const routes_1 = __importDefault(require("./routes"));
const internal_1 = __importDefault(require("./routes/internal"));
function createApp() {
    const app = (0, express_1.default)();
    app.use(express_1.default.json());
    app.use((0, cookie_parser_1.default)());
    app.get("/health", (_req, res) => res.json({ status: "ok", service: "auth" }));
    app.use("/api/v1", routes_1.default);
    app.use("/internal", internal_1.default);
    app.use(errorHandler_1.errorHandler);
    return app;
}
