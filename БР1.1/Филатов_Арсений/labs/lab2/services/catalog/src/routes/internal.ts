import { Elysia, t } from "elysia";
import { ApiError, ExperienceLevelDto, IndustryDto, SkillDto } from "../schemas";
import { db } from "../db/client";
import { apiError, assertInternal, internalUnauthorized } from "../lib/errors";

export const internalRoutes = new Elysia({ name: "catalog-internal" })
  .get(
    "/internal/industries/:id",
    async ({ params, headers, set }) => {
      if (!assertInternal(headers as Record<string, string | undefined>)) {
        set.status = 401;
        return internalUnauthorized();
      }
      const row = await db.industry.findUnique({ where: { id: params.id } });
      if (!row) {
        set.status = 404;
        return apiError("NOT_FOUND", "Отрасль не найдена");
      }
      return row;
    },
    {
      params: t.Object({ id: t.Numeric() }),
      response: { 200: IndustryDto, 401: ApiError, 404: ApiError },
    }
  )
  .get(
    "/internal/experience-levels/:id",
    async ({ params, headers, set }) => {
      if (!assertInternal(headers as Record<string, string | undefined>)) {
        set.status = 401;
        return internalUnauthorized();
      }
      const row = await db.experienceLevel.findUnique({ where: { id: params.id } });
      if (!row) {
        set.status = 404;
        return apiError("NOT_FOUND", "Уровень опыта не найден");
      }
      return row;
    },
    {
      params: t.Object({ id: t.Numeric() }),
      response: { 200: ExperienceLevelDto, 401: ApiError, 404: ApiError },
    }
  )
  .post(
    "/internal/skills/validate",
    async ({ body, headers, set }) => {
      if (!assertInternal(headers as Record<string, string | undefined>)) {
        set.status = 401;
        return internalUnauthorized();
      }
      const ids = [...new Set(body.ids)];
      if (!ids.length) {
        return { valid: true, missing: [] as number[] };
      }
      const found = await db.skill.findMany({
        where: { id: { in: ids } },
        select: { id: true },
      });
      const foundSet = new Set(found.map((f) => f.id));
      const missing = ids.filter((id) => !foundSet.has(id));
      return { valid: missing.length === 0, missing };
    },
    {
      body: t.Object({ ids: t.Array(t.Number()) }),
      response: {
        200: t.Object({ valid: t.Boolean(), missing: t.Array(t.Number()) }),
        401: ApiError,
      },
    }
  )
  .get(
    "/internal/skills",
    async ({ query, headers, set }) => {
      if (!assertInternal(headers as Record<string, string | undefined>)) {
        set.status = 401;
        return internalUnauthorized();
      }
      const ids = query.ids.split(",").map((s) => Number(s.trim())).filter((n) => Number.isInteger(n));
      const items = await db.skill.findMany({ where: { id: { in: ids } } });
      return { items };
    },
    {
      query: t.Object({ ids: t.String() }),
      response: { 200: t.Object({ items: t.Array(SkillDto) }), 401: ApiError },
    }
  );
