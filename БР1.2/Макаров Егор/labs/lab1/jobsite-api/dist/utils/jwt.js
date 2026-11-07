"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyRefreshToken = exports.verifyAccessToken = exports.signRefreshToken = exports.signAccessToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const signAccessToken = (payload) => jsonwebtoken_1.default.sign(payload, env_1.env.jwt.accessSecret, { expiresIn: env_1.env.jwt.accessExpiresIn });
exports.signAccessToken = signAccessToken;
const signRefreshToken = (payload) => jsonwebtoken_1.default.sign(payload, env_1.env.jwt.refreshSecret, { expiresIn: env_1.env.jwt.refreshExpiresIn });
exports.signRefreshToken = signRefreshToken;
const verifyAccessToken = (token) => jsonwebtoken_1.default.verify(token, env_1.env.jwt.accessSecret);
exports.verifyAccessToken = verifyAccessToken;
const verifyRefreshToken = (token) => jsonwebtoken_1.default.verify(token, env_1.env.jwt.refreshSecret);
exports.verifyRefreshToken = verifyRefreshToken;
//# sourceMappingURL=jwt.js.map