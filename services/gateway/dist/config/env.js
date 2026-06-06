"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
function required(name) {
    const v = process.env[name]?.trim();
    if (!v)
        throw new Error(`${name} is required`);
    return v;
}
exports.env = {
    port: parseInt(process.env.PORT || "3000", 10),
    nodeEnv: process.env.NODE_ENV || "development",
    authServiceUrl: required("AUTH_SERVICE_URL"),
    profileServiceUrl: required("PROFILE_SERVICE_URL"),
    vacancyServiceUrl: required("VACANCY_SERVICE_URL"),
    allowedOrigins: (process.env.ALLOWED_ORIGINS || "http://localhost:5173,http://localhost:3000")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
};
