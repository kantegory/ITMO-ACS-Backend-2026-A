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
    port: parseInt(process.env.PORT || "3003", 10),
    nodeEnv: process.env.NODE_ENV || "development",
    databaseUrl: required("DATABASE_URL"),
    accessTokenSecret: required("ACCESS_TOKEN_SECRET"),
    authServiceUrl: required("AUTH_SERVICE_URL"),
    serviceToken: required("SERVICE_TOKEN"),
    rabbitmqUrl: required("RABBITMQ_URL"),
};
if (exports.env.accessTokenSecret.length < 32) {
    throw new Error("ACCESS_TOKEN_SECRET must be at least 32 characters");
}
