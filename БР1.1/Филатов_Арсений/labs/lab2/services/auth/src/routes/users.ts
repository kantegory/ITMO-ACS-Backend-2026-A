import { Elysia, t } from "elysia";
import { ApiError, UserPublic } from "../schemas";
import { db } from "../db/client";
import { getAuthUser, userWithoutPassword } from "../lib/auth";
import { apiError } from "../lib/errors";

export const usersRoutes = new Elysia({ name: "users" })
  .get(
    "/me",
    async ({ headers, set }) => {
      const user = await getAuthUser(headers as Record<string, string | undefined>);
      if (!user) {
        set.status = 401;
        return apiError("UNAUTHORIZED", "Пользователь не авторизован");
      }
      return userWithoutPassword(user);
    },
    {
      detail: {
        summary: "Текущий пользователь",
        description: "Данные учётной записи без пароля и хэша.",
        tags: ["users"],
        security: [{ bearerAuth: [] }],
      },
      response: {
        200: UserPublic,
        401: ApiError,
      },
    }
  )
  .patch(
    "/me",
    async ({ body, headers, set }) => {
      const user = await getAuthUser(headers as Record<string, string | undefined>);
      if (!user) {
        set.status = 401;
        return apiError("UNAUTHORIZED", "Пользователь не авторизован");
      }

      if (body.email) {
        const existing = await db.user.findUnique({ where: { email: body.email } });
        if (existing && existing.id !== user.id) {
          set.status = 409;
          return apiError("CONFLICT", "Email уже используется");
        }
      }

      const updated = await db.user.update({
        where: { id: user.id },
        data: {
          email: body.email ?? undefined,
          isActive: body.isActive ?? undefined,
        },
        include: { role: true },
      });
      return userWithoutPassword(updated);
    },
    {
      detail: {
        summary: "Обновление email / активности",
        description: "Частичное обновление полей пользователя.",
        tags: ["users"],
        security: [{ bearerAuth: [] }],
      },
      body: t.Object({
        email: t.Optional(t.String({ format: "email" })),
        isActive: t.Optional(t.Boolean()),
      }),
      response: {
        200: UserPublic,
        400: ApiError,
        401: ApiError,
        409: ApiError,
      },
    }
  );
