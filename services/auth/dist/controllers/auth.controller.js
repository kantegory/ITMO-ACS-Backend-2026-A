"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InternalController = exports.UserController = exports.AuthController = void 0;
const auth_service_1 = require("../services/auth.service");
const env_1 = require("../config/env");
const mappers_1 = require("../utils/mappers");
const errors_1 = require("../utils/errors");
const params_1 = require("../utils/params");
function setRefreshCookie(res, token) {
    res.cookie("refresh_token", token, {
        httpOnly: true,
        secure: env_1.env.cookieSecure,
        sameSite: "lax",
        path: "/api/v1/auth",
        maxAge: 30 * 24 * 60 * 60 * 1000,
    });
}
class AuthController {
    static async register(req, res, next) {
        try {
            const { email, password, full_name, role } = req.body;
            const { user, tokens } = await auth_service_1.AuthService.register({
                email,
                password,
                fullName: full_name,
                role: role,
                userAgent: req.headers["user-agent"],
                ip: req.ip,
            });
            setRefreshCookie(res, tokens.refreshToken);
            res.status(201).json({
                access_token: tokens.accessToken,
                user: (0, mappers_1.toUser)(user),
            });
        }
        catch (e) {
            next(e);
        }
    }
    static async login(req, res, next) {
        try {
            const { email, password } = req.body;
            const { user, tokens } = await auth_service_1.AuthService.login({
                email,
                password,
                userAgent: req.headers["user-agent"],
                ip: req.ip,
            });
            setRefreshCookie(res, tokens.refreshToken);
            res.json({ access_token: tokens.accessToken, user: (0, mappers_1.toUser)(user) });
        }
        catch (e) {
            next(e);
        }
    }
    static async refresh(req, res, next) {
        try {
            const rt = req.cookies?.refresh_token;
            if (!rt)
                throw (0, errors_1.unauthorized)();
            const tokens = await auth_service_1.AuthService.refresh(rt, req.headers["user-agent"], req.ip);
            setRefreshCookie(res, tokens.refreshToken);
            res.json({ access_token: tokens.accessToken });
        }
        catch (e) {
            next(e);
        }
    }
    static async logout(req, res, next) {
        try {
            const rt = req.cookies?.refresh_token;
            if (rt)
                await auth_service_1.AuthService.logout(rt);
            res.clearCookie("refresh_token", { path: "/api/v1/auth" });
            res.status(204).send();
        }
        catch (e) {
            next(e);
        }
    }
}
exports.AuthController = AuthController;
class UserController {
    static async me(req, res, next) {
        try {
            const user = await auth_service_1.UserService.getById(req.user.userId);
            res.json((0, mappers_1.toUser)(user));
        }
        catch (e) {
            next(e);
        }
    }
}
exports.UserController = UserController;
class InternalController {
    static async getUser(req, res, next) {
        try {
            const user = await auth_service_1.UserService.getById((0, params_1.routeParam)(req.params.id));
            res.json((0, mappers_1.toUserInternal)(user));
        }
        catch (e) {
            next(e);
        }
    }
    static async validateUser(req, res, next) {
        try {
            const role = typeof req.query.role === "string" ? req.query.role : undefined;
            const user = await auth_service_1.UserService.validate((0, params_1.routeParam)(req.params.id), role);
            res.json((0, mappers_1.toUserInternal)(user));
        }
        catch (e) {
            next(e);
        }
    }
}
exports.InternalController = InternalController;
