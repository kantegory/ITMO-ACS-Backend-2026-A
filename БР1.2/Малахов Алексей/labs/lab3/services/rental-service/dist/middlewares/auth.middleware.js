"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const settings_1 = __importDefault(require("../config/settings"));
const authMiddleware = (req, res, next) => {
    try {
        const [, token] = (req.headers.authorization || '').split(' ');
        if (!token)
            return res.status(401).json({ code: 'UNAUTHORIZED', message: 'No token provided' });
        const { user } = jsonwebtoken_1.default.verify(token, settings_1.default.JWT_SECRET_KEY);
        req.user = user;
        next();
    }
    catch (_a) {
        return res.status(403).json({ code: 'FORBIDDEN', message: 'Token is invalid or expired' });
    }
};
exports.default = authMiddleware;
