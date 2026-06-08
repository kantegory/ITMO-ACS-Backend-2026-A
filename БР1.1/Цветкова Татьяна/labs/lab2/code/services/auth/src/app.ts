import "reflect-metadata";
import express, { Request, Response } from "express";
import cors from "cors";
import morgan from "morgan";
import bcrypt from "bcrypt";
import { plainToInstance } from "class-transformer";
import { IsEmail, IsString, Length, MinLength, validate } from "class-validator";
import { AppDataSource } from "./config/data-source";
import { User } from "./entities/User";
import {
  asyncHandler,
  ConflictError,
  errorHandler,
  EventBus,
  notFoundHandler,
  signAccessToken,
  signRefreshToken,
  UnauthorizedError,
  ValidationError,
  verifyToken,
} from "@fitness/shared";

const SERVICE_NAME = "auth-service";

class RegisterDto {
  @IsEmail() email: string;
  @IsString() @Length(3, 32) username: string;
  @IsString() @MinLength(8) password: string;
}
class LoginDto {
  @IsEmail() email: string;
  @IsString() @MinLength(8) password: string;
}

const validateDto = async <T extends object>(cls: new () => T, payload: object): Promise<T> => {
  const instance = plainToInstance(cls, payload);
  const errors = await validate(instance as object, { whitelist: true });
  if (errors.length) {
    throw new ValidationError(
      errors.map((e) => ({ property: e.property, constraints: e.constraints })),
    );
  }
  return instance;
};

export const createApp = (bus: EventBus) => {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use(morgan("dev"));

  const JWT_SECRET = process.env.JWT_SECRET ?? "super_secret_change_me";
  const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET ?? "super_refresh_secret_change_me";
  const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? "1d";
  const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN ?? "7d";

  const repo = () => AppDataSource.getRepository(User);

  const tokens = (u: User) => {
    const payload = { sub: u.id, email: u.email, role: u.role };
    return {
      accessToken: signAccessToken(payload, JWT_SECRET, JWT_EXPIRES_IN),
      refreshToken: signRefreshToken(payload, JWT_REFRESH_SECRET, JWT_REFRESH_EXPIRES_IN),
    };
  };

  app.get("/health", (_req, res) => res.json({ status: "ok", service: SERVICE_NAME }));

  // ===== Public =====

  app.post(
    "/auth/register",
    asyncHandler(async (req: Request, res: Response) => {
      const dto = await validateDto(RegisterDto, req.body);
      const existing = await repo().findOne({
        where: [{ email: dto.email }, { username: dto.username }],
      });
      if (existing) throw new ConflictError("User with this email or username already exists");

      const user = repo().create({
        email: dto.email,
        username: dto.username,
        passwordHash: await bcrypt.hash(dto.password, 10),
        role: "user",
      });
      await repo().save(user);

      // публикуем событие — profile/notification получат
      await bus.publish("user.created", {
        userId: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
      });

      res.status(201).json({
        ...tokens(user),
        user: { id: user.id, email: user.email, username: user.username, role: user.role },
      });
    }),
  );

  app.post(
    "/auth/login",
    asyncHandler(async (req: Request, res: Response) => {
      const dto = await validateDto(LoginDto, req.body);
      const user = await repo()
        .createQueryBuilder("u")
        .addSelect("u.passwordHash")
        .where("u.email = :email", { email: dto.email })
        .getOne();
      if (!user) throw new UnauthorizedError("Invalid email or password");
      const ok = await bcrypt.compare(dto.password, user.passwordHash);
      if (!ok) throw new UnauthorizedError("Invalid email or password");

      res.json({
        ...tokens(user),
        user: { id: user.id, email: user.email, username: user.username, role: user.role },
      });
    }),
  );

  app.post(
    "/auth/refresh",
    asyncHandler(async (req: Request, res: Response) => {
      const { refreshToken } = req.body ?? {};
      if (!refreshToken) throw new UnauthorizedError("refreshToken required");
      let payload;
      try {
        payload = verifyToken(refreshToken, JWT_REFRESH_SECRET);
      } catch {
        throw new UnauthorizedError("Invalid refresh token");
      }
      const user = await repo().findOne({ where: { id: payload.sub } });
      if (!user) throw new UnauthorizedError("User no longer exists");
      res.json({
        ...tokens(user),
        user: { id: user.id, email: user.email, username: user.username, role: user.role },
      });
    }),
  );

  // ===== Internal API (для других сервисов) =====

  app.post(
    "/internal/auth/validate",
    asyncHandler(async (req: Request, res: Response) => {
      const { token } = req.body ?? {};
      if (!token) return res.status(400).json({ error: "token required" });
      try {
        const payload = verifyToken(token, JWT_SECRET);
        return res.json({
          valid: true,
          userId: payload.sub,
          email: payload.email,
          role: payload.role,
        });
      } catch {
        return res.status(401).json({ error: "Invalid token", valid: false });
      }
    }),
  );

  app.get(
    "/internal/auth/users/:id",
    asyncHandler(async (req: Request, res: Response) => {
      const user = await repo().findOne({ where: { id: req.params.id } });
      if (!user) return res.status(404).json({ error: "User not found" });
      res.json({
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        active: user.active,
      });
    }),
  );

  app.post(
    "/internal/auth/users/batch",
    asyncHandler(async (req: Request, res: Response) => {
      const { ids } = req.body ?? {};
      if (!Array.isArray(ids)) return res.status(400).json({ error: "ids must be an array" });
      const users = await repo()
        .createQueryBuilder("u")
        .where("u.id IN (:...ids)", { ids: ids.length ? ids : [""] })
        .getMany();
      res.json(
        users.map((u) => ({
          id: u.id,
          email: u.email,
          username: u.username,
          role: u.role,
          active: u.active,
        })),
      );
    }),
  );

  // Входящие события (нет, auth ничего не слушает, но bus.router всё равно подключаем,
  // чтобы можно было slать диагностические события)
  app.use("/internal/events", bus.router);

  app.use(notFoundHandler);
  app.use(errorHandler(SERVICE_NAME));
  return app;
};
