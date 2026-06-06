"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
exports.requireRole = requireRole;
const tokens_1 = require("../utils/tokens");
const errors_1 = require("../utils/errors");
function authMiddleware(req, _res, next) {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
        return next((0, errors_1.unauthorized)());
    }
    try {
        const payload = (0, tokens_1.verifyAccessToken)(header.slice(7));
        req.user = { userId: payload.userId, role: payload.role };
        next();
    }
    catch {
        next((0, errors_1.unauthorized)());
    }
}
function requireRole(...roles) {
    return (req, _res, next) => {
        if (!req.user)
            return next((0, errors_1.unauthorized)());
        if (!roles.includes(req.user.role))
            return next((0, errors_1.forbidden)());
        next();
    };
}
