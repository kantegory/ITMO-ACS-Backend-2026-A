import { Elysia, t } from "elysia";
import { requireAccessContext } from "@lab2/auth-jwt";
import { ApiError, ApplicationDto, paginated } from "../schemas";
import { db } from "../db/client";
import { apiError } from "../lib/errors";
import { employerEmployerAccess, employerGetVacancy, jobseekerResumeOk } from "../lib/upstream";

type ApplicationStatusApi = "new" | "viewed" | "rejected" | "invited";

const asApplicationDto = <
  T extends {
    id: number;
    vacancyId: number;
    userId: number;
    resumeId: number;
    status: string;
    createdAt: Date;
  },
>(
  row: T
) => ({ ...row, status: row.status as ApplicationStatusApi });

async function requireCtx(headers: Record<string, string | undefined>, set: { status?: number }) {
  const ctx = await requireAccessContext(headers);
  if (!ctx) {
    set.status = 401;
    return null;
  }
  return ctx;
}

export const applicationsRoutes = new Elysia({ name: "applications" })
  .post(
    "/vacancies/:vacancyId/applications",
    async ({ params, body, headers, set }) => {
      const ctx = await requireCtx(headers as Record<string, string | undefined>, set);
      if (!ctx) return apiError("UNAUTHORIZED", "Пользователь не авторизован");

      const vacancy = await employerGetVacancy(params.vacancyId);
      if (!vacancy) {
        set.status = 404;
        return apiError("NOT_FOUND", "Вакансия не найдена");
      }

      const resumeOk = await jobseekerResumeOk(body.resumeId, ctx.userId);
      if (!resumeOk) {
        set.status = 400;
        return apiError("VALIDATION_ERROR", "Резюме не найдено или не принадлежит пользователю");
      }

      const existing = await db.application.findUnique({
        where: { vacancyId_userId: { vacancyId: params.vacancyId, userId: ctx.userId } },
      });
      if (existing) {
        set.status = 409;
        return apiError("CONFLICT", "Отклик уже существует");
      }

      const created = await db.application.create({
        data: {
          vacancyId: params.vacancyId,
          userId: ctx.userId,
          resumeId: body.resumeId,
          status: "new",
        },
      });
      set.status = 201;
      return asApplicationDto(created);
    },
    {
      detail: {
        summary: "Откликнуться на вакансию",
        tags: ["applications"],
        security: [{ bearerAuth: [] }],
      },
      params: t.Object({ vacancyId: t.Numeric() }),
      body: t.Object({ resumeId: t.Numeric() }),
      response: {
        201: ApplicationDto,
        400: ApiError,
        401: ApiError,
        404: ApiError,
        409: ApiError,
      },
    }
  )
  .get(
    "/me/applications",
    async ({ query, headers, set }) => {
      const ctx = await requireCtx(headers as Record<string, string | undefined>, set);
      if (!ctx) return apiError("UNAUTHORIZED", "Пользователь не авторизован");
      const page = query.page ?? 1;
      const pageSize = query.pageSize ?? 20;
      const [items, total] = await Promise.all([
        db.application.findMany({
          where: { userId: ctx.userId },
          orderBy: { id: "desc" },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        db.application.count({ where: { userId: ctx.userId } }),
      ]);
      return { items: items.map(asApplicationDto), total, page, pageSize };
    },
    {
      detail: {
        summary: "Мои отклики",
        tags: ["applications"],
        security: [{ bearerAuth: [] }],
      },
      query: t.Object({
        page: t.Optional(t.Numeric()),
        pageSize: t.Optional(t.Numeric()),
      }),
      response: { 200: paginated(ApplicationDto), 401: ApiError },
    }
  )
  .get(
    "/vacancies/:vacancyId/applications",
    async ({ params, query, headers, set }) => {
      const ctx = await requireCtx(headers as Record<string, string | undefined>, set);
      if (!ctx) return apiError("UNAUTHORIZED", "Пользователь не авторизован");

      const vacancy = await employerGetVacancy(params.vacancyId);
      if (!vacancy) {
        set.status = 404;
        return apiError("NOT_FOUND", "Вакансия не найдена");
      }

      const access = await employerEmployerAccess(params.vacancyId, ctx.userId);
      if (!access || !access.allowed) {
        set.status = 403;
        return apiError("FORBIDDEN", "Нет доступа к откликам вакансии");
      }

      const page = query.page ?? 1;
      const pageSize = query.pageSize ?? 20;
      const [items, total] = await Promise.all([
        db.application.findMany({
          where: { vacancyId: params.vacancyId },
          orderBy: { id: "desc" },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        db.application.count({ where: { vacancyId: params.vacancyId } }),
      ]);
      return { items: items.map(asApplicationDto), total, page, pageSize };
    },
    {
      detail: {
        summary: "Отклики на вакансию (работодатель)",
        tags: ["applications"],
        security: [{ bearerAuth: [] }],
      },
      params: t.Object({ vacancyId: t.Numeric() }),
      query: t.Object({
        page: t.Optional(t.Numeric()),
        pageSize: t.Optional(t.Numeric()),
      }),
      response: {
        200: paginated(ApplicationDto),
        401: ApiError,
        403: ApiError,
        404: ApiError,
      },
    }
  )
  .patch(
    "/applications/:applicationId",
    async ({ params, body, headers, set }) => {
      const ctx = await requireCtx(headers as Record<string, string | undefined>, set);
      if (!ctx) return apiError("UNAUTHORIZED", "Пользователь не авторизован");

      const application = await db.application.findUnique({
        where: { id: params.applicationId },
      });
      if (!application) {
        set.status = 404;
        return apiError("NOT_FOUND", "Отклик не найден");
      }

      const access = await employerEmployerAccess(application.vacancyId, ctx.userId);
      if (!access || !access.allowed) {
        set.status = 403;
        return apiError("FORBIDDEN", "Нет доступа к отклику");
      }

      const updated = await db.application.update({
        where: { id: params.applicationId },
        data: { status: body.status },
      });
      return asApplicationDto({ ...updated, status: body.status });
    },
    {
      detail: {
        summary: "Обновить статус отклика",
        tags: ["applications"],
        security: [{ bearerAuth: [] }],
      },
      params: t.Object({ applicationId: t.Numeric() }),
      body: t.Object({
        status: t.Union([
          t.Literal("new"),
          t.Literal("viewed"),
          t.Literal("rejected"),
          t.Literal("invited"),
        ]),
      }),
      response: {
        200: ApplicationDto,
        400: ApiError,
        401: ApiError,
        403: ApiError,
        404: ApiError,
      },
    }
  );
