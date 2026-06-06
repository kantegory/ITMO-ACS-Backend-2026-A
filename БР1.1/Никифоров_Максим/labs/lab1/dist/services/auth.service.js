"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const data_source_1 = require("../data-source");
const User_1 = require("../entities/User");
const RefreshSession_1 = require("../entities/RefreshSession");
const tokens_1 = require("../utils/tokens");
const errors_1 = require("../utils/errors");
const userRepo = () => data_source_1.AppDataSource.getRepository(User_1.User);
const sessionRepo = () => data_source_1.AppDataSource.getRepository(RefreshSession_1.RefreshSession);
function parseDuration(s) {
    const m = s.match(/^(\d+)([smhd])$/);
    if (!m)
        return 30 * 24 * 60 * 60 * 1000;
    const n = parseInt(m[1], 10);
    const u = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
    return n * (u[m[2]] || 86400000);
}
class AuthService {
    static async register(input) {
        const role = input.role || "candidate";
        if (role !== "candidate" && role !== "employer")
            throw (0, errors_1.badRequest)();
        const email = input.email.trim().toLowerCase();
        const existing = await userRepo().findOne({ where: { email } });
        if (existing)
            throw (0, errors_1.conflict)();
        const passwordHash = await bcrypt_1.default.hash(input.password, 10);
        const user = userRepo().create({
            email,
            passwordHash,
            role,
            fullName: input.fullName.trim(),
        });
        await userRepo().save(user);
        const tokens = await this.issueSession(user, input.userAgent, input.ip);
        return { user, tokens };
    }
    static async login(input) {
        const user = await userRepo().findOne({
            where: { email: input.email.trim().toLowerCase() },
        });
        if (!user)
            throw (0, errors_1.unauthorized)();
        const ok = await bcrypt_1.default.compare(input.password, user.passwordHash);
        if (!ok)
            throw (0, errors_1.unauthorized)();
        const tokens = await this.issueSession(user, input.userAgent, input.ip);
        return { user, tokens };
    }
    static async refresh(refreshToken, userAgent, ip) {
        const hash = (0, tokens_1.hashRefreshToken)(refreshToken);
        const session = await sessionRepo().findOne({ where: { tokenHash: hash } });
        if (!session || session.revokedAt || session.expiresAt < new Date()) {
            throw (0, errors_1.unauthorized)();
        }
        const user = await userRepo().findOneByOrFail({ id: session.userId });
        session.revokedAt = new Date();
        session.lastUsedAt = new Date();
        await sessionRepo().save(session);
        const tokens = await this.issueSession(user, userAgent, ip);
        return tokens;
    }
    static async logout(refreshToken) {
        const hash = (0, tokens_1.hashRefreshToken)(refreshToken);
        const session = await sessionRepo().findOne({ where: { tokenHash: hash } });
        if (session && !session.revokedAt) {
            session.revokedAt = new Date();
            await sessionRepo().save(session);
        }
    }
    static async issueSession(user, userAgent, ip) {
        const accessToken = (0, tokens_1.signAccessToken)(user.id, user.role);
        const { plain, hash } = (0, tokens_1.newRefreshToken)();
        const ttl = parseDuration(process.env.REFRESH_TOKEN_TTL || "30d");
        const now = new Date();
        const session = sessionRepo().create({
            userId: user.id,
            tokenHash: hash,
            userAgent: userAgent || null,
            ip: ip || null,
            expiresAt: new Date(now.getTime() + ttl),
            lastUsedAt: now,
        });
        await sessionRepo().save(session);
        return { accessToken, refreshToken: plain };
    }
}
exports.AuthService = AuthService;
