"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const settings_1 = __importDefault(require("../config/settings"));
const serviceAuthMiddleware = (req, res, next) => {
    if (req.headers['x-service-token'] !== settings_1.default.SERVICE_TOKEN) {
        return res.status(401).json({ code: 'UNAUTHORIZED', message: 'Invalid service token' });
    }
    next();
};
exports.default = serviceAuthMiddleware;
