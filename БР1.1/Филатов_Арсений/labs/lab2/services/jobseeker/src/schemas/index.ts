import { t, type TSchema } from "elysia";

export const ApiError = t.Object({
  code: t.String(),
  message: t.String(),
  details: t.Optional(t.Unknown()),
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

export const paginated = <S extends TSchema>(itemSchema: S) =>
  t.Object({
    items: t.Array(itemSchema),
    total: t.Number(),
    page: t.Number(),
    pageSize: t.Number(),
  });
