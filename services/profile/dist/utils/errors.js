"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.unauthorized = exports.badRequest = exports.forbidden = exports.conflict = exports.notFound = exports.AppError = void 0;
class AppError extends Error {
    statusCode;
    constructor(statusCode, message) {
        super(message);
        this.statusCode = statusCode;
        this.name = "AppError";
    }
}
exports.AppError = AppError;
const notFound = () => new AppError(404, "not found");
exports.notFound = notFound;
const conflict = () => new AppError(409, "already exists");
exports.conflict = conflict;
const forbidden = () => new AppError(403, "forbidden");
exports.forbidden = forbidden;
const badRequest = () => new AppError(400, "invalid input");
exports.badRequest = badRequest;
const unauthorized = () => new AppError(401, "invalid credentials");
exports.unauthorized = unauthorized;
