"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = createApp;
const express_1 = __importDefault(require("express"));
const errorHandler_1 = require("./middleware/errorHandler");
const routes_1 = __importDefault(require("./routes"));
function createApp() {
    const app = (0, express_1.default)();
    app.use(express_1.default.json());
    app.get("/health", (_req, res) => res.json({ status: "ok", service: "profile" }));
    app.use("/api/v1", routes_1.default);
    app.use(errorHandler_1.errorHandler);
    return app;
}
