import { Elysia, t } from "elysia";
import { ApiError, ApplicationDto, paginated } from "../schemas";
import { db } from "../db/client";
import { getAuthUser } from "../lib/auth";
import { apiError } from "../lib/errors";

/** Prisma иногда выводит enum-поля как string; для схемы ответа нужен литеральный union. */
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

export const applicationsRoutes = new Elysia({ name: "applications" })
  .post(
    "/vacancies/:vacancyId/applications",
    async ({ params, body, headers, set }) => {
      const user = await getAuthUser(headers as Record<string, string | undefined>);
      if (!user) {
        set.status = 401;
        return apiError("UNAUTHORIZED", "Пользователь не авторизован");
      }
      const vacancy = await db.vacancy.findUnique({ where: { id: params.vacancyId } });
      if (!vacancy) {
        set.status = 404;
        return apiError("NOT_FOUND", "Вакансия не найдена");
      }
      const resume = await db.resume.findUnique({ where: { id: body.resumeId } });
      if (!resume || resume.userId !== user.id) {
        set.status = 400;
        return apiError("VALIDATION_ERROR", "Резюме не найдено или не принадлежит пользователю");
      }
      const existing = await db.application.findUnique({
        where: { vacancyId_userId: { vacancyId: params.vacancyId, userId: user.id } },
      });
      if (existing) {
        set.status = 409;
        return apiError("CONFLICT", "Отклик уже существует");
      }
      const created = await db.application.create({
        data: {
          vacancyId: params.vacancyId,
          userId: user.id,
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
        description: "Создаёт Application с ссылкой на выбранное резюме.",
        tags: ["applications"],
        security: [{ bearerAuth: [] }],
      },
      params: t.Object({ vacancyId: t.Numeric() }),
      body: t.Object({
        resumeId: t.Numeric(),
      }),
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
      const user = await getAuthUser(headers as Record<string, string | undefined>);
      if (!user) {
        set.status = 401;
        return apiError("UNAUTHORIZED", "Пользователь не авторизован");
      }
      const page = query.page ?? 1;
      const pageSize = query.pageSize ?? 20;
      const [items, total] = await Promise.all([
        db.application.findMany({
          where: { userId: user.id },
          orderBy: { id: "desc" },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        db.application.count({ where: { userId: user.id } }),
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
      response: {
        200: paginated(ApplicationDto),
        401: ApiError,
      },
    }
  )
  .get(
    "/vacancies/:vacancyId/applications",
    async ({ params, query, headers, set }) => {
      const user = await getAuthUser(headers as Record<string, string | undefined>);
      if (!user) {
        set.status = 401;
        return apiError("UNAUTHORIZED", "Пользователь не авторизован");
      }
      const vacancy = await db.vacancy.findUnique({ where: { id: params.vacancyId } });
      if (!vacancy) {
        set.status = 404;
        return apiError("NOT_FOUND", "Вакансия не найдена");
      }
      const membership = await db.employerMembership.findUnique({
        where: { userId_companyId: { userId: user.id, companyId: vacancy.companyId } },
      });
      if (!membership) {
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
      const user = await getAuthUser(headers as Record<string, string | undefined>);
      if (!user) {
        set.status = 401;
        return apiError("UNAUTHORIZED", "Пользователь не авторизован");
      }
      const application = await db.application.findUnique({
        where: { id: params.applicationId },
        include: { vacancy: true },
      });
      if (!application) {
        set.status = 404;
        return apiError("NOT_FOUND", "Отклик не найден");
      }
      const membership = await db.employerMembership.findUnique({
        where: {
          userId_companyId: { userId: user.id, companyId: application.vacancy.companyId },
        },
      });
      if (!membership) {
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
        description: "Действие работодателя: viewed / rejected / invited.",
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
