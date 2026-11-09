"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAdmin = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res
            .status(401)
            .json({
            error: "Unauthorized",
            message: "No token provided",
            status_code: 401,
        });
        return;
    }
    const token = authHeader.split(" ")[1];
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        req.user = {
            id: decoded.id,
            email: decoded.email,
            role: decoded.role,
        };
        next();
    }
    catch (error) {
        res
            .status(401)
            .json({
            error: "Unauthorized",
            message: "Invalid or expired token",
            status_code: 401,
        });
        return;
    }
};
exports.authenticate = authenticate;
const requireAdmin = (req, res, next) => {
    if (req.user?.role !== "admin" && req.user?.role !== "trainer") {
        res
            .status(403)
            .json({
            error: "Forbidden",
            message: "Admin or trainer role required",
            status_code: 403,
        });
        return;
    }
    next();
};
exports.requireAdmin = requireAdmin;
