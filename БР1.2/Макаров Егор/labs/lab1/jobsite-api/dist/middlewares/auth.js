"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = exports.authenticate = void 0;
const jwt_1 = require("../utils/jwt");
const httpError_1 = require("../utils/httpError");
const authenticate = (req, _res, next) => {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
        throw httpError_1.HttpError.unauthorized();
    }
    const token = header.slice(7);
    try {
        const payload = (0, jwt_1.verifyAccessToken)(token);
        req.user = { id: payload.sub, role: payload.role };
        next();
    }
    catch {
        throw httpError_1.HttpError.unauthorized('Недействительный или истёкший токен');
    }
};
exports.authenticate = authenticate;
const requireRole = (...roles) => (req, _res, next) => {
    if (!req.user)
        throw httpError_1.HttpError.unauthorized();
    if (!roles.includes(req.user.role)) {
        throw httpError_1.HttpError.forbidden('Операция недоступна для вашей роли');
    }
    next();
};
exports.requireRole = requireRole;
//# sourceMappingURL=auth.js.map