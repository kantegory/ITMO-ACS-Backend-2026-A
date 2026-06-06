"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signAccessToken = signAccessToken;
exports.verifyAccessToken = verifyAccessToken;
exports.newRefreshToken = newRefreshToken;
exports.hashRefreshToken = hashRefreshToken;
const crypto_1 = __importDefault(require("crypto"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
function signAccessToken(userId, role) {
    return jsonwebtoken_1.default.sign({ userId, role }, env_1.env.accessTokenSecret, {
        expiresIn: env_1.env.accessTokenTtl,
    });
}
function verifyAccessToken(token) {
    return jsonwebtoken_1.default.verify(token, env_1.env.accessTokenSecret);
}
function newRefreshToken() {
    const plain = crypto_1.default.randomBytes(32).toString("base64url");
    const hash = hashRefreshToken(plain);
    return { plain, hash };
}
function hashRefreshToken(plain) {
    return crypto_1.default
        .createHmac("sha256", env_1.env.refreshTokenSecret)
        .update(plain)
        .digest("hex");
}
