"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const data_source_1 = require("../data-source");
const User_1 = require("../entity/User");
const UserProfile_1 = require("../entity/UserProfile");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jwt_1 = require("../utils/jwt");
class AuthController {
    static async register(req, res) {
        const { email, password, full_name } = req.body;
        if (!email || !password || !full_name) {
            res
                .status(400)
                .json({
                error: "Bad Request",
                message: "Missing required fields",
                status_code: 400,
            });
            return;
        }
        if (password.length < 6) {
            res
                .status(400)
                .json({
                error: "Bad Request",
                message: "Password must be at least 6 characters",
                status_code: 400,
            });
            return;
        }
        const userRepo = data_source_1.AppDataSource.getRepository(User_1.User);
        const existing = await userRepo.findOneBy({ email });
        if (existing) {
            res
                .status(409)
                .json({
                error: "Conflict",
                message: "Email already exists",
                status_code: 409,
            });
            return;
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        const user = userRepo.create({ email, password_hash: hashedPassword });
        await userRepo.save(user);
        const profileRepo = data_source_1.AppDataSource.getRepository(UserProfile_1.UserProfile);
        const profile = profileRepo.create({ user_id: user.id, full_name });
        await profileRepo.save(profile);
        const accessToken = (0, jwt_1.generateAccessToken)({
            id: user.id,
            email: user.email,
            role: user.role,
        });
        const refreshToken = (0, jwt_1.generateRefreshToken)({
            id: user.id,
            email: user.email,
            role: user.role,
        });
        res.status(201).json({
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                created_at: user.created_at,
                updated_at: user.updated_at,
            },
            access_token: accessToken,
            refresh_token: refreshToken,
        });
    }
    static async login(req, res) {
        const { email, password } = req.body;
        const userRepo = data_source_1.AppDataSource.getRepository(User_1.User);
        const user = await userRepo.findOneBy({ email });
        if (!user) {
            res
                .status(401)
                .json({
                error: "Unauthorized",
                message: "Invalid credentials",
                status_code: 401,
            });
            return;
        }
        const isValid = await bcryptjs_1.default.compare(password, user.password_hash);
        if (!isValid) {
            res
                .status(401)
                .json({
                error: "Unauthorized",
                message: "Invalid credentials",
                status_code: 401,
            });
            return;
        }
        const accessToken = (0, jwt_1.generateAccessToken)({
            id: user.id,
            email: user.email,
            role: user.role,
        });
        const refreshToken = (0, jwt_1.generateRefreshToken)({
            id: user.id,
            email: user.email,
            role: user.role,
        });
        res.json({
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                created_at: user.created_at,
                updated_at: user.updated_at,
            },
            access_token: accessToken,
            refresh_token: refreshToken,
        });
    }
    static async refresh(req, res) {
        const { refresh_token } = req.body;
        if (!refresh_token) {
            res
                .status(400)
                .json({
                error: "Bad Request",
                message: "Refresh token required",
                status_code: 400,
            });
            return;
        }
        const decoded = (0, jwt_1.verifyToken)(refresh_token);
        if (!decoded) {
            res
                .status(401)
                .json({
                error: "Unauthorized",
                message: "Invalid refresh token",
                status_code: 401,
            });
            return;
        }
        const accessToken = (0, jwt_1.generateAccessToken)({
            id: decoded.id,
            email: decoded.email,
            role: decoded.role,
        });
        res.json({ access_token: accessToken });
    }
    static async logout(req, res) {
        res.status(204).send();
    }
}
exports.AuthController = AuthController;
