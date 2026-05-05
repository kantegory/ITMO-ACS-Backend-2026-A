import { Elysia, t } from "elysia";
import { requireAccessContext } from "@lab2/auth-jwt";
import { ApiError, SkillDto, VacancyDto, VacancyListItem, paginated } from "../schemas";
import { db } from "../db/client";
import { apiError } from "../lib/errors";
import {
  catalogGetExperienceLevel,
  catalogGetIndustry,
  catalogGetSkillsByIds,
  catalogValidateSkills,
} from "../lib/catalogClient";

async function requireCtx(headers: Record<string, string | undefined>, set: { status?: number }) {
  const ctx = await requireAccessContext(headers);
  if (!ctx) {
    set.status = 401;
    return null;
  }
  return ctx;
}

export const vacanciesRoutes = new Elysia({ name: "vacancies" })
  .get(
    "/vacancies",
    async ({ query }) => {
      const page = query.page ?? 1;
      const pageSize = query.pageSize ?? 20;
      const where = {
        industryId: query.industryId ?? undefined,
        experienceLevelId: query.experienceLevelId ?? undefined,
        salaryMin: query.salaryMin ? { gte: query.salaryMin } : undefined,
        salaryMax: query.salaryMax ? { lte: query.salaryMax } : undefined,
        title: query.q ? { contains: query.q, mode: "insensitive" as const } : undefined,
      };
      const [items, total] = await Promise.all([
        db.vacancy.findMany({
          where,
          include: { company: true },
          skip: (page - 1) * pageSize,
          take: pageSize,
          orderBy: { id: "desc" },
        }),
        db.vacancy.count({ where }),
      ]);

      return {
        items: items.map((v) => ({
          id: v.id,
          companyId: v.companyId,
          companyName: v.company.name,
          title: v.title,
          salaryMin: v.salaryMin,
          salaryMax: v.salaryMax,
          currency: v.currency,
          industryId: v.industryId,
          experienceLevelId: v.experienceLevelId,
          status: v.status,
          publishedAt: v.publishedAt,
        })),
        total,
        page,
        pageSize,
      };
    },
    {
      detail: { summary: "Поиск вакансий", tags: ["vacancies"] },
      query: t.Object({
        industryId: t.Optional(t.Numeric()),
        experienceLevelId: t.Optional(t.Numeric()),
        salaryMin: t.Optional(t.Numeric()),
        salaryMax: t.Optional(t.Numeric()),
        q: t.Optional(t.String()),
        page: t.Optional(t.Numeric()),
        pageSize: t.Optional(t.Numeric()),
      }),
      response: { 200: paginated(VacancyListItem), 400: ApiError },
    }
  )
  .get(
    "/vacancies/:vacancyId",
    async ({ params, set }) => {
      const vacancy = await db.vacancy.findUnique({ where: { id: params.vacancyId } });
      if (!vacancy) {
        set.status = 404;
        return apiError("NOT_FOUND", "Вакансия не найдена");
      }
      return vacancy;
    },
    {
      detail: { summary: "Детали вакансии", tags: ["vacancies"] },
      params: t.Object({ vacancyId: t.Numeric() }),
      response: { 200: VacancyDto, 404: ApiError },
    }
  )
  .post(
    "/companies/:companyId/vacancies",
    async ({ params, body, headers, set }) => {
      const ctx = await requireCtx(headers as Record<string, string | undefined>, set);
      if (!ctx) return apiError("UNAUTHORIZED", "Пользователь не авторизован");

      const membership = await db.employerMembership.findUnique({
        where: { userId_companyId: { userId: ctx.userId, companyId: params.companyId } },
      });
      if (!membership) {
        set.status = 403;
        return apiError("FORBIDDEN", "Нет доступа к компании");
      }

      const indOk = await catalogGetIndustry(body.industryId);
      const expOk = await catalogGetExperienceLevel(body.experienceLevelId);
      if (!indOk || !expOk) {
        set.status = 400;
        return apiError("VALIDATION_ERROR", "Отрасль или уровень опыта не найдены в каталоге");
      }

      const created = await db.vacancy.create({
        data: {
          companyId: params.companyId,
          title: body.title,
          description: body.description,
          requirements: body.requirements,
          salaryMin: body.salaryMin,
          salaryMax: body.salaryMax,
          currency: body.currency,
          employmentType: body.employmentType,
          industryId: body.industryId,
          experienceLevelId: body.experienceLevelId,
          status: body.status ?? "draft",
          publishedAt: body.status === "published" ? new Date() : null,
        },
      });
      set.status = 201;
      return created;
    },
    {
      detail: { summary: "Создать вакансию", tags: ["vacancies"], security: [{ bearerAuth: [] }] },
      params: t.Object({ companyId: t.Numeric() }),
      body: t.Object({
        title: t.String(),
        description: t.String(),
        requirements: t.Optional(t.String()),
        salaryMin: t.Optional(t.Numeric()),
        salaryMax: t.Optional(t.Numeric()),
        currency: t.String(),
        employmentType: t.Union([
          t.Literal("full_time"),
          t.Literal("part_time"),
          t.Literal("contract"),
        ]),
        industryId: t.Numeric(),
        experienceLevelId: t.Numeric(),
        status: t.Optional(
          t.Union([t.Literal("draft"), t.Literal("published"), t.Literal("closed")])
        ),
      }),
      response: { 201: VacancyDto, 400: ApiError, 401: ApiError, 403: ApiError },
    }
  )
  .patch(
    "/vacancies/:vacancyId",
    async ({ params, body, headers, set }) => {
      const ctx = await requireCtx(headers as Record<string, string | undefined>, set);
      if (!ctx) return apiError("UNAUTHORIZED", "Пользователь не авторизован");
      const existing = await db.vacancy.findUnique({ where: { id: params.vacancyId } });
      if (!existing) {
        set.status = 404;
        return apiError("NOT_FOUND", "Вакансия не найдена");
      }
      const membership = await db.employerMembership.findUnique({
        where: { userId_companyId: { userId: ctx.userId, companyId: existing.companyId } },
      });
      if (!membership) {
        set.status = 403;
        return apiError("FORBIDDEN", "Нет доступа к вакансии");
      }

      if (body.industryId != null) {
        const ok = await catalogGetIndustry(body.industryId);
        if (!ok) {
          set.status = 400;
          return apiError("VALIDATION_ERROR", "Отрасль не найдена");
        }
      }
      if (body.experienceLevelId != null) {
        const ok = await catalogGetExperienceLevel(body.experienceLevelId);
        if (!ok) {
          set.status = 400;
          return apiError("VALIDATION_ERROR", "Уровень опыта не найден");
        }
      }

      const updated = await db.vacancy.update({
        where: { id: params.vacancyId },
        data: {
          ...body,
          publishedAt:
            body.status === "published" && !existing.publishedAt ? new Date() : undefined,
        },
      });
      return updated;
    },
    {
      detail: { summary: "Обновить вакансию", tags: ["vacancies"], security: [{ bearerAuth: [] }] },
      params: t.Object({ vacancyId: t.Numeric() }),
      body: t.Object({
        title: t.Optional(t.String()),
        description: t.Optional(t.String()),
        requirements: t.Optional(t.String()),
        salaryMin: t.Optional(t.Numeric()),
        salaryMax: t.Optional(t.Numeric()),
        currency: t.Optional(t.String()),
        employmentType: t.Optional(
          t.Union([
            t.Literal("full_time"),
            t.Literal("part_time"),
            t.Literal("contract"),
          ])
        ),
        industryId: t.Optional(t.Numeric()),
        experienceLevelId: t.Optional(t.Numeric()),
        status: t.Optional(
          t.Union([t.Literal("draft"), t.Literal("published"), t.Literal("closed")])
        ),
      }),
      response: { 200: VacancyDto, 401: ApiError, 403: ApiError, 404: ApiError },
    }
  )
  .delete(
    "/vacancies/:vacancyId",
    async ({ params, headers, set }) => {
      const ctx = await requireCtx(headers as Record<string, string | undefined>, set);
      if (!ctx) return apiError("UNAUTHORIZED", "Пользователь не авторизован");
      const existing = await db.vacancy.findUnique({ where: { id: params.vacancyId } });
      if (!existing) {
        set.status = 404;
        return apiError("NOT_FOUND", "Вакансия не найдена");
      }
      const membership = await db.employerMembership.findUnique({
        where: { userId_companyId: { userId: ctx.userId, companyId: existing.companyId } },
      });
      if (!membership) {
        set.status = 403;
        return apiError("FORBIDDEN", "Нет доступа к вакансии");
      }
      await db.vacancy.delete({ where: { id: params.vacancyId } });
      return { deleted: true, id: params.vacancyId };
    },
    {
      detail: { summary: "Удалить вакансию", tags: ["vacancies"], security: [{ bearerAuth: [] }] },
      params: t.Object({ vacancyId: t.Numeric() }),
      response: {
        200: t.Object({ deleted: t.Boolean(), id: t.Number() }),
        401: ApiError,
        403: ApiError,
        404: ApiError,
      },
    }
  )
  .put(
    "/vacancies/:vacancyId/skills",
    async ({ params, body, headers, set }) => {
      const ctx = await requireCtx(headers as Record<string, string | undefined>, set);
      if (!ctx) return apiError("UNAUTHORIZED", "Пользователь не авторизован");
      const vacancy = await db.vacancy.findUnique({ where: { id: params.vacancyId } });
      if (!vacancy) {
        set.status = 404;
        return apiError("NOT_FOUND", "Вакансия не найдена");
      }
      const membership = await db.employerMembership.findUnique({
        where: { userId_companyId: { userId: ctx.userId, companyId: vacancy.companyId } },
      });
      if (!membership) {
        set.status = 403;
        return apiError("FORBIDDEN", "Нет доступа к вакансии");
      }

      const val = await catalogValidateSkills(body.skillIds);
      if (!val.valid) {
        set.status = 400;
        return apiError("VALIDATION_ERROR", "Неизвестные skillId", { missing: val.missing });
      }

      await db.vacancySkill.deleteMany({ where: { vacancyId: params.vacancyId } });
      if (body.skillIds.length) {
        await db.vacancySkill.createMany({
          data: body.skillIds.map((skillId) => ({ vacancyId: params.vacancyId, skillId })),
          skipDuplicates: true,
        });
      }

      const skills = await catalogGetSkillsByIds(body.skillIds);
      return { vacancyId: params.vacancyId, skillIds: body.skillIds, skills };
    },
    {
      detail: { summary: "Заменить навыки вакансии", tags: ["vacancies"], security: [{ bearerAuth: [] }] },
      params: t.Object({ vacancyId: t.Numeric() }),
      body: t.Object({ skillIds: t.Array(t.Number()) }),
      response: {
        200: t.Object({
          vacancyId: t.Number(),
          skillIds: t.Array(t.Number()),
          skills: t.Array(SkillDto),
        }),
        400: ApiError,
        401: ApiError,
        404: ApiError,
      },
    }
  );
