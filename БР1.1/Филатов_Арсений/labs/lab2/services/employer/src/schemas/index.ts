import { t, type TSchema } from "elysia";

export const ApiError = t.Object({
  code: t.String(),
  message: t.String(),
  details: t.Optional(t.Unknown()),
});

export const SkillDto = t.Object({
  id: t.Number(),
  name: t.String(),
});

export const CompanyDto = t.Object({
  id: t.Number(),
  industryId: t.Number(),
  name: t.String(),
  description: t.Optional(t.String()),
  website: t.Optional(t.String()),
  legalName: t.Optional(t.String()),
  createdAt: t.String({ format: "date-time" }),
});

export const EmployerMembershipDto = t.Object({
  id: t.Number(),
  userId: t.Number(),
  companyId: t.Number(),
  positionTitle: t.Optional(t.String()),
  isOwner: t.Boolean(),
});

export const VacancyStatus = t.Union([
  t.Literal("draft"),
  t.Literal("published"),
  t.Literal("closed"),
]);

export const EmploymentType = t.Union([
  t.Literal("full_time"),
  t.Literal("part_time"),
  t.Literal("contract"),
]);

export const VacancyDto = t.Object({
  id: t.Number(),
  companyId: t.Number(),
  industryId: t.Number(),
  experienceLevelId: t.Number(),
  title: t.String(),
  description: t.String(),
  requirements: t.Union([t.String(), t.Null()]),
  salaryMin: t.Union([t.Number(), t.Null()]),
  salaryMax: t.Union([t.Number(), t.Null()]),
  currency: t.String(),
  employmentType: EmploymentType,
  status: VacancyStatus,
  publishedAt: t.Union([t.Date(), t.Null()]),
  createdAt: t.Date(),
  updatedAt: t.Date(),
});

export const VacancyListItem = t.Object({
  id: t.Number(),
  companyId: t.Number(),
  companyName: t.String(),
  title: t.String(),
  salaryMin: t.Union([t.Number(), t.Null()]),
  salaryMax: t.Union([t.Number(), t.Null()]),
  currency: t.String(),
  industryId: t.Number(),
  experienceLevelId: t.Number(),
  status: VacancyStatus,
  publishedAt: t.Union([t.Date(), t.Null()]),
});

export const paginated = <S extends TSchema>(itemSchema: S) =>
  t.Object({
    items: t.Array(itemSchema),
    total: t.Number(),
    page: t.Number(),
    pageSize: t.Number(),
  });
