import { t, type TSchema } from "elysia";

export const ApiError = t.Object({
  code: t.String({
    description:
      "Код ошибки: VALIDATION_ERROR | UNAUTHORIZED | FORBIDDEN | NOT_FOUND | CONFLICT | INTERNAL_ERROR",
  }),
  message: t.String({ description: "Описание ошибки" }),
  details: t.Optional(
    t.Unknown({ description: "Дополнительные поля" })
  ),
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

export const JobSeekerProfileDto = t.Object({
  userId: t.Number(),
  firstName: t.String(),
  lastName: t.String(),
  phone: t.Optional(t.String()),
  city: t.Optional(t.String()),
  bio: t.Optional(t.String()),
});

export const ResumeDto = t.Object({
  id: t.Number(),
  userId: t.Number(),
  title: t.String(),
  summary: t.Optional(t.String()),
  updatedAt: t.String({ format: "date-time" }),
  isPublic: t.Boolean(),
});

export const ResumeEducationDto = t.Object({
  id: t.Number(),
  resumeId: t.Number(),
  institution: t.String(),
  degree: t.Optional(t.String()),
  yearFrom: t.Optional(t.Number()),
  yearTo: t.Optional(t.Number()),
});

export const ResumeWorkExperienceDto = t.Object({
  id: t.Number(),
  resumeId: t.Number(),
  companyName: t.String(),
  position: t.String(),
  description: t.Optional(t.String()),
  dateFrom: t.Optional(t.String({ format: "date" })),
  dateTo: t.Optional(t.String({ format: "date" })),
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

export const IndustryDto = t.Object({
  id: t.Number(),
  name: t.String(),
});

export const ExperienceLevelDto = t.Object({
  id: t.Number(),
  code: t.String(),
  name: t.String(),
  sortOrder: t.Number(),
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

export const ApplicationStatus = t.Union([
  t.Literal("new"),
  t.Literal("viewed"),
  t.Literal("rejected"),
  t.Literal("invited"),
]);

export const ApplicationDto = t.Object({
  id: t.Number(),
  vacancyId: t.Number(),
  userId: t.Number(),
  resumeId: t.Number(),
  status: ApplicationStatus,
  createdAt: t.Date(),
});

export const paginated = <S extends TSchema>(itemSchema: S) =>
  t.Object({
    items: t.Array(itemSchema),
    total: t.Number(),
    page: t.Number(),
    pageSize: t.Number(),
  });
