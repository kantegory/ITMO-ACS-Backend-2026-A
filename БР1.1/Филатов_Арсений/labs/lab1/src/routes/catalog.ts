import { Elysia, t } from "elysia";
import {
  ApiError,
  ExperienceLevelDto,
  IndustryDto,
  SkillDto,
  paginated,
} from "../schemas";
import { db } from "../db/client";

export const catalogRoutes = new Elysia({ name: "catalog" })
  .get(
    "/industries",
    async () => ({
      items: await db.industry.findMany({ orderBy: { id: "asc" } }),
    }),
    {
      detail: {
        summary: "Список отраслей",
        tags: ["catalog"],
      },
      response: {
        200: t.Object({ items: t.Array(IndustryDto) }),
      },
    }
  )
  .get(
    "/experience-levels",
    async () => ({
      items: await db.experienceLevel.findMany({ orderBy: { sortOrder: "asc" } }),
    }),
    {
      detail: {
        summary: "Уровни опыта",
        description: "Справочник для фильтра вакансий и полей резюме.",
        tags: ["catalog"],
      },
      response: {
        200: t.Object({ items: t.Array(ExperienceLevelDto) }),
      },
    }
  )
  .get(
    "/skills",
    async ({ query }) => {
      const page = query.page ?? 1;
      const pageSize = query.pageSize ?? 20;
      const where = query.q
        ? {
            name: {
              contains: query.q,
              mode: "insensitive" as const,
            },
          }
        : {};

      const [items, total] = await Promise.all([
        db.skill.findMany({
          where,
          orderBy: { name: "asc" },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        db.skill.count({ where }),
      ]);

      return { items, total, page, pageSize };
    },
    {
      detail: {
        summary: "Каталог навыков",
        description: "Пагинация и поиск по подстроке в названии.",
        tags: ["catalog"],
      },
      query: t.Object({
        q: t.Optional(t.String()),
        page: t.Optional(t.Numeric()),
        pageSize: t.Optional(t.Numeric()),
      }),
      response: {
        200: paginated(SkillDto),
        400: ApiError,
      },
    }
  );
