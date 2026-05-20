import bcrypt from "bcrypt";
import { AppDataSource } from "../data-source";
import { User, UserRole } from "../entities/User";
import { RefreshSession } from "../entities/RefreshSession";
import { hashRefreshToken, newRefreshToken, signAccessToken } from "../utils/tokens";
import { badRequest, conflict, unauthorized } from "../utils/errors";

const userRepo = () => AppDataSource.getRepository(User);
const sessionRepo = () => AppDataSource.getRepository(RefreshSession);

function parseDuration(s: string): number {
  const m = s.match(/^(\d+)([smhd])$/);
  if (!m) return 30 * 24 * 60 * 60 * 1000;
  const n = parseInt(m[1], 10);
  const u: Record<string, number> = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
  return n * (u[m[2]] || 86400000);
}

export class AuthService {
  static async register(input: {
    email: string;
    password: string;
    fullName: string;
    role?: UserRole;
    userAgent?: string;
    ip?: string;
  }) {
    const role = input.role || "candidate";
    if (role !== "candidate" && role !== "employer") throw badRequest();

    const email = input.email.trim().toLowerCase();
    const existing = await userRepo().findOne({ where: { email } });
    if (existing) throw conflict();

    const passwordHash = await bcrypt.hash(input.password, 10);
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

  static async login(input: {
    email: string;
    password: string;
    userAgent?: string;
    ip?: string;
  }) {
    const user = await userRepo().findOne({
      where: { email: input.email.trim().toLowerCase() },
    });
    if (!user) throw unauthorized();
    const ok = await bcrypt.compare(input.password, user.passwordHash);
    if (!ok) throw unauthorized();

    const tokens = await this.issueSession(user, input.userAgent, input.ip);
    return { user, tokens };
  }

  static async refresh(refreshToken: string, userAgent?: string, ip?: string) {
    const hash = hashRefreshToken(refreshToken);
    const session = await sessionRepo().findOne({ where: { tokenHash: hash } });
    if (!session || session.revokedAt || session.expiresAt < new Date()) {
      throw unauthorized();
    }

    const user = await userRepo().findOneByOrFail({ id: session.userId });
    session.revokedAt = new Date();
    session.lastUsedAt = new Date();
    await sessionRepo().save(session);

    const tokens = await this.issueSession(user, userAgent, ip);
    return tokens;
  }

  static async logout(refreshToken: string) {
    const hash = hashRefreshToken(refreshToken);
    const session = await sessionRepo().findOne({ where: { tokenHash: hash } });
    if (session && !session.revokedAt) {
      session.revokedAt = new Date();
      await sessionRepo().save(session);
    }
  }

  private static async issueSession(
    user: User,
    userAgent?: string,
    ip?: string,
  ) {
    const accessToken = signAccessToken(user.id, user.role);
    const { plain, hash } = newRefreshToken();
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
