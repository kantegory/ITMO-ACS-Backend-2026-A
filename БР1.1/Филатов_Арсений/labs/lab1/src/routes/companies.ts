import { Elysia, t } from "elysia";
import { ApiError, CompanyDto, EmployerMembershipDto } from "../schemas";
import { db } from "../db/client";
import { getAuthUser } from "../lib/auth";
import { apiError } from "../lib/errors";

const mapCompany = (company: {
  id: number;
  industryId: number;
  name: string;
  description: string | null;
  website: string | null;
  legalName: string | null;
  createdAt: Date;
}) => ({
  id: company.id,
  industryId: company.industryId,
  name: company.name,
  description: company.description ?? undefined,
  website: company.website ?? undefined,
  legalName: company.legalName ?? undefined,
  createdAt: company.createdAt.toISOString(),
});

export const companiesRoutes = new Elysia({ name: "companies" })
  .post(
    "/companies",
    async ({ body, headers, set }) => {
      const user = await getAuthUser(headers as Record<string, string | undefined>);
      if (!user) {
        set.status = 401;
        return apiError("UNAUTHORIZED", "Пользователь не авторизован");
      }

      if (user.role.code === "candidate") {
        set.status = 403;
        return apiError("FORBIDDEN", "Только работодатели могут создавать компании");
      }

      const created = await db.company.create({
        data: {
          name: body.name,
          industryId: body.industryId,
          description: body.description,
          website: body.website,
          legalName: body.legalName,
          memberships: {
            create: {
              userId: user.id,
              isOwner: true,
            },
          },
        },
      });
      set.status = 201;
      return mapCompany(created);
    },
    {
      detail: {
        summary: "Создать компанию",
        description: "Обычно для роли работодателя; дальше — приглашения в EmployerMembership.",
        tags: ["companies"],
        security: [{ bearerAuth: [] }],
      },
      body: t.Object({
        name: t.String(),
        industryId: t.Numeric(),
        description: t.Optional(t.String()),
        website: t.Optional(t.String()),
        legalName: t.Optional(t.String()),
      }),
      response: {
        201: CompanyDto,
        400: ApiError,
        401: ApiError,
        403: ApiError,
      },
    }
  )
  .get(
    "/companies/:companyId",
    async ({ params, set }) => {
      const company = await db.company.findUnique({ where: { id: params.companyId } });
      if (!company) {
        set.status = 404;
        return apiError("NOT_FOUND", "Компания не найдена");
      }
      return mapCompany(company);
    },
    {
      detail: {
        summary: "Карточка компании",
        description: "Публичные данные для страницы вакансии.",
        tags: ["companies"],
      },
      params: t.Object({ companyId: t.Numeric() }),
      response: {
        200: CompanyDto,
        404: ApiError,
      },
    }
  )
  .patch(
    "/companies/:companyId",
    async ({ params, body, headers, set }) => {
      const user = await getAuthUser(headers as Record<string, string | undefined>);
      if (!user) {
        set.status = 401;
        return apiError("UNAUTHORIZED", "Пользователь не авторизован");
      }

      const membership = await db.employerMembership.findUnique({
        where: { userId_companyId: { userId: user.id, companyId: params.companyId } },
      });
      if (!membership) {
        set.status = 403;
        return apiError("FORBIDDEN", "Нет доступа к компании");
      }

      const updated = await db.company.update({
        where: { id: params.companyId },
        data: {
          name: body.name ?? undefined,
          industryId: body.industryId ?? undefined,
          description: body.description ?? undefined,
          website: body.website ?? undefined,
          legalName: body.legalName ?? undefined,
        },
      });
      return mapCompany(updated);
    },
    {
      detail: {
        summary: "Обновить компанию",
        tags: ["companies"],
        security: [{ bearerAuth: [] }],
      },
      params: t.Object({ companyId: t.Numeric() }),
      body: t.Object({
        name: t.Optional(t.String()),
        industryId: t.Optional(t.Numeric()),
        description: t.Optional(t.String()),
        website: t.Optional(t.String()),
        legalName: t.Optional(t.String()),
      }),
      response: {
        200: CompanyDto,
        401: ApiError,
        403: ApiError,
        404: ApiError,
      },
    }
  )
  .get(
    "/me/employer/memberships",
    async ({ headers, set }) => {
      const user = await getAuthUser(headers as Record<string, string | undefined>);
      if (!user) {
        set.status = 401;
        return apiError("UNAUTHORIZED", "Пользователь не авторизован");
      }
      return {
        items: (await db.employerMembership.findMany({
          where: { userId: user.id },
          orderBy: { id: "asc" },
        })).map((item) => ({
          ...item,
          positionTitle: item.positionTitle ?? undefined,
        })),
      };
    },
    {
      detail: {
        summary: "Мои членства в компаниях",
        tags: ["companies"],
        security: [{ bearerAuth: [] }],
      },
      response: {
        200: t.Object({ items: t.Array(EmployerMembershipDto) }),
        401: ApiError,
      },
    }
  );
