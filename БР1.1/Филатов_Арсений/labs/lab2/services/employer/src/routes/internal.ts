import { Elysia, t } from "elysia";
import { ApiError } from "../schemas";
import { db } from "../db/client";
import { apiError, assertInternal } from "../lib/errors";

export const internalRoutes = new Elysia({ name: "employer-internal" })
  .get(
    "/internal/vacancies/:vacancyId",
    async ({ params, headers, set }) => {
      if (!assertInternal(headers as Record<string, string | undefined>)) {
        set.status = 401;
        return apiError("UNAUTHORIZED", "Неверный internal secret");
      }
      const v = await db.vacancy.findUnique({ where: { id: params.vacancyId } });
      if (!v) {
        set.status = 404;
        return apiError("NOT_FOUND", "Вакансия не найдена");
      }
      return { id: v.id, companyId: v.companyId };
    },
    {
      params: t.Object({ vacancyId: t.Numeric() }),
      response: {
        200: t.Object({ id: t.Number(), companyId: t.Number() }),
        401: ApiError,
        404: ApiError,
      },
    }
  )
  .get(
    "/internal/vacancies/:vacancyId/employer-access",
    async ({ params, query, headers, set }) => {
      if (!assertInternal(headers as Record<string, string | undefined>)) {
        set.status = 401;
        return apiError("UNAUTHORIZED", "Неверный internal secret");
      }
      const userId = Number(query.userId);
      if (!Number.isInteger(userId)) {
        set.status = 400;
        return apiError("VALIDATION_ERROR", "userId обязателен");
      }
      const v = await db.vacancy.findUnique({ where: { id: params.vacancyId } });
      if (!v) {
        set.status = 404;
        return apiError("NOT_FOUND", "Вакансия не найдена");
      }
      const m = await db.employerMembership.findUnique({
        where: { userId_companyId: { userId, companyId: v.companyId } },
      });
      return { allowed: !!m, companyId: v.companyId };
    },
    {
      params: t.Object({ vacancyId: t.Numeric() }),
      query: t.Object({ userId: t.Numeric() }),
      response: {
        200: t.Object({ allowed: t.Boolean(), companyId: t.Number() }),
        400: ApiError,
        401: ApiError,
        404: ApiError,
      },
    }
  );
