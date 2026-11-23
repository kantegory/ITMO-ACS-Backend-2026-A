import { Elysia, t } from "elysia";
import { createAccessToken } from "@lab2/auth-jwt";
import { ApiError, TokenPair, UserPublic } from "../schemas";
import { compareSync, hashSync } from "bcryptjs";
import { db } from "../db/client";
import { createRefreshToken, verifyRefreshTokenJwt } from "../lib/refresh";
import { userWithoutPassword } from "../lib/auth";
import { apiError } from "../lib/errors";

export const authRoutes = new Elysia({ name: "auth" }).group("/auth", (app) =>
  app
    .post(
      "/register",
      async ({ body, set }) => {
        const existing = await db.user.findUnique({ where: { email: body.email } });
        if (existing) {
          set.status = 409;
          return apiError("CONFLICT", "Пользователь с таким email уже существует");
        }

        const role = await db.role.findUnique({ where: { code: body.roleCode } });
        if (!role) {
          set.status = 400;
          return apiError("VALIDATION_ERROR", "Некорректная роль");
        }

        const user = await db.user.create({
          data: {
            email: body.email,
            passwordHash: hashSync(body.password, 10),
            roleId: role.id,
            isActive: true,
          },
          include: { role: true },
        });

        const accessToken = await createAccessToken(user.id, user.role.code);
        const refreshToken = await createRefreshToken(user.id);
        await db.refreshToken.create({
          data: {
            userId: user.id,
            token: refreshToken,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          },
        });

        set.status = 201;
        return {
          user: userWithoutPassword(user),
          accessToken,
          refreshToken,
          tokenType: "Bearer" as const,
          expiresIn: Number(process.env.JWT_EXPIRES_IN ?? 3600),
        };
      },
      {
        detail: {
          summary: "Регистрация",
          description:
            "Создание пользователя с ролью соискателя или работодателя. Пароль передаётся в теле и не возвращается.",
          tags: ["auth"],
        },
        body: t.Object({
          email: t.String({ format: "email" }),
          password: t.String({ minLength: 8, description: "Пароль (в БД хранится только хэш)" }),
          roleCode: t.Union([t.Literal("candidate"), t.Literal("employer")]),
        }),
        response: {
          201: t.Object({
            user: UserPublic,
            accessToken: t.String(),
            refreshToken: t.String(),
            tokenType: t.Literal("Bearer"),
            expiresIn: t.Number(),
          }),
          400: ApiError,
          409: ApiError,
        },
      }
    )
    .post(
      "/login",
      async ({ body, set }) => {
        const user = await db.user.findUnique({
          where: { email: body.email },
          include: { role: true },
        });
        if (!user || !compareSync(body.password, user.passwordHash)) {
          set.status = 401;
          return apiError("UNAUTHORIZED", "Неверный email или пароль");
        }

        const accessToken = await createAccessToken(user.id, user.role.code);
        const refreshToken = await createRefreshToken(user.id);
        await db.refreshToken.create({
          data: {
            userId: user.id,
            token: refreshToken,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          },
        });

        return {
          user: userWithoutPassword(user),
          accessToken,
          refreshToken,
          tokenType: "Bearer" as const,
          expiresIn: Number(process.env.JWT_EXPIRES_IN ?? 3600),
        };
      },
      {
        detail: {
          summary: "Вход",
          description: "Выдача пары access/refresh токенов при верных учётных данных.",
          tags: ["auth"],
        },
        body: t.Object({
          email: t.String({ format: "email" }),
          password: t.String(),
        }),
        response: {
          200: t.Object({
            user: UserPublic,
            accessToken: t.String(),
            refreshToken: t.String(),
            tokenType: t.Literal("Bearer"),
            expiresIn: t.Number(),
          }),
          401: ApiError,
          422: ApiError,
        },
      }
    )
    .post(
      "/refresh",
      async ({ body, set }) => {
        const subFromJwt = await verifyRefreshTokenJwt(body.refreshToken);
        const existing = await db.refreshToken.findUnique({
          where: { token: body.refreshToken },
        });

        if (
          subFromJwt === null ||
          !existing ||
          existing.expiresAt < new Date() ||
          existing.userId !== subFromJwt
        ) {
          set.status = 401;
          return apiError("UNAUTHORIZED", "Refresh token недействителен");
        }

        const user = await db.user.findUnique({
          where: { id: existing.userId },
          include: { role: true },
        });
        if (!user) {
          set.status = 401;
          return apiError("UNAUTHORIZED", "Refresh token недействителен");
        }

        const accessToken = await createAccessToken(existing.userId, user.role.code);
        const refreshToken = await createRefreshToken(existing.userId);
        await db.refreshToken.delete({ where: { token: body.refreshToken } });
        await db.refreshToken.create({
          data: {
            userId: existing.userId,
            token: refreshToken,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          },
        });

        return {
          accessToken,
          refreshToken,
          tokenType: "Bearer" as const,
          expiresIn: Number(process.env.JWT_EXPIRES_IN ?? 3600),
        };
      },
      {
        detail: {
          summary: "Обновление access-токена",
          tags: ["auth"],
        },
        body: t.Object({
          refreshToken: t.String(),
        }),
        response: {
          200: TokenPair,
          401: ApiError,
        },
      }
    )
);
