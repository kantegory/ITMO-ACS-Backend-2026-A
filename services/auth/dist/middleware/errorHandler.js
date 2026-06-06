"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
const errors_1 = require("../utils/errors");
const typeorm_1 = require("typeorm");
function errorHandler(err, _req, res, _next) {
    if (err instanceof errors_1.AppError) {
        res.status(err.statusCode).json({ error: err.message });
        return;
    }
    if (err instanceof typeorm_1.QueryFailedError && err.code === "23505") {
        res.status(409).json({ error: "already exists" });
        return;
    }
    console.error(err);
    res.status(500).json({ error: "internal server error" });
}
