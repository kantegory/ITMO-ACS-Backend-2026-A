import bcrypt from "bcrypt";
import { AppDataSource } from "../config/data-source";
import { User, UserRole } from "../entities/User";
import { RegisterDto, LoginDto } from "../dto/auth.dto";
import {
  ConflictError,
  UnauthorizedError,
} from "../utils/AppError";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt";

const SALT_ROUNDS = 10;

export class AuthService {
  private repo = AppDataSource.getRepository(User);

  async register(dto: RegisterDto) {
    const existing = await this.repo.findOne({
      where: [{ email: dto.email }, { username: dto.username }],
    });
    if (existing) {
      throw new ConflictError("User with this email or username already exists");
    }

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);
    const user = this.repo.create({
      email: dto.email,
      username: dto.username,
      passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
      role: UserRole.USER,
    });
    await this.repo.save(user);

    return this.buildAuthResponse(user);
  }

  async login(dto: LoginDto) {
    const user = await this.repo
      .createQueryBuilder("u")
      .addSelect("u.passwordHash")
      .where("u.email = :email", { email: dto.email })
      .getOne();
    if (!user) throw new UnauthorizedError("Invalid email or password");

    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) throw new UnauthorizedError("Invalid email or password");

    return this.buildAuthResponse(user);
  }

  async refresh(refreshToken: string) {
    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw new UnauthorizedError("Invalid refresh token");
    }
    const user = await this.repo.findOne({ where: { id: payload.sub } });
    if (!user) throw new UnauthorizedError("User no longer exists");
    return this.buildAuthResponse(user);
  }

  private buildAuthResponse(user: User) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    return {
      accessToken: signAccessToken(payload),
      refreshToken: signRefreshToken(payload),
      user: this.sanitize(user),
    };
  }

  private sanitize(user: User) {
    const { passwordHash, ...rest } = user as User & { passwordHash?: string };
    return rest;
  }
}
