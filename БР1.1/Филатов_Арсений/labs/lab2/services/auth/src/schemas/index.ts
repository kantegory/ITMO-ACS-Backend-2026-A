import { t, type TSchema } from "elysia";

export const ApiError = t.Object({
  code: t.String({
    description:
      "Код ошибки: VALIDATION_ERROR | UNAUTHORIZED | FORBIDDEN | NOT_FOUND | CONFLICT | INTERNAL_ERROR",
  }),
  message: t.String({ description: "Описание ошибки" }),
  details: t.Optional(t.Unknown({ description: "Дополнительные поля" })),
});

export const TokenPair = t.Object({
  accessToken: t.String(),
  refreshToken: t.String(),
  tokenType: t.Literal("Bearer"),
  expiresIn: t.Number({ description: "Срок жизни токена в секундах" }),
});

export const RoleDto = t.Object({
  id: t.Number(),
  code: t.String({ description: "Код роли в БД (candidate | employer | admin)" }),
  name: t.String(),
});

export const UserPublic = t.Object({
  id: t.Number(),
  email: t.String({ format: "email" }),
  roleId: t.Number(),
  isActive: t.Boolean(),
  createdAt: t.Date(),
  updatedAt: t.Date(),
  role: RoleDto,
});

export const paginated = <S extends TSchema>(itemSchema: S) =>
  t.Object({
    items: t.Array(itemSchema),
    total: t.Number(),
    page: t.Number(),
    pageSize: t.Number(),
  });
