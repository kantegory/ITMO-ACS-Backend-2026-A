"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const settings_1 = require("../config/settings");
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        res.status(401).json({
            statusCode: 401,
            error: 'Unauthorized',
            message: 'Access token is missing or invalid'
        });
        return;
    }
    jsonwebtoken_1.default.verify(token, settings_1.SETTINGS.JWT_SECRET, (err, decoded) => {
        if (err) {
            res.status(401).json({
                statusCode: 401,
                error: 'Unauthorized',
                message: 'Token has expired or is invalid'
            });
            return;
        }
        req.user = decoded;
        next();
    });
};
exports.authenticateToken = authenticateToken;
const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            res.status(403).json({
                statusCode: 403,
                error: 'Forbidden',
                message: 'Insufficient permissions'
            });
            return;
        }
        next();
    };
};
exports.requireRole = requireRole;
