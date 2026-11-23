import { Elysia, t } from "elysia";
import {
  ApiError,
  JobSeekerProfileDto,
  ResumeDto,
  ResumeEducationDto,
  ResumeWorkExperienceDto,
  SkillDto,
} from "../schemas";
import { db } from "../db/client";
import { getAuthUser } from "../lib/auth";
import { apiError } from "../lib/errors";

const mapResume = (resume: { id: number; userId: number; title: string; summary: string | null; updatedAt: Date; isPublic: boolean }) => ({
  id: resume.id,
  userId: resume.userId,
  title: resume.title,
  summary: resume.summary ?? undefined,
  updatedAt: resume.updatedAt.toISOString(),
  isPublic: resume.isPublic,
});

const mapProfile = (profile: {
  userId: number;
  firstName: string;
  lastName: string;
  phone: string | null;
  city: string | null;
  bio: string | null;
}) => ({
  userId: profile.userId,
  firstName: profile.firstName,
  lastName: profile.lastName,
  phone: profile.phone ?? undefined,
  city: profile.city ?? undefined,
  bio: profile.bio ?? undefined,
});

const mapEducation = (item: {
  id: number;
  resumeId: number;
  institution: string;
  degree: string | null;
  yearFrom: number | null;
  yearTo: number | null;
}) => ({
  id: item.id,
  resumeId: item.resumeId,
  institution: item.institution,
  degree: item.degree ?? undefined,
  yearFrom: item.yearFrom ?? undefined,
  yearTo: item.yearTo ?? undefined,
});

const mapWorkExperience = (item: {
  id: number;
  resumeId: number;
  companyName: string;
  position: string;
  description: string | null;
  dateFrom: string | null;
  dateTo: string | null;
}) => ({
  id: item.id,
  resumeId: item.resumeId,
  companyName: item.companyName,
  position: item.position,
  description: item.description ?? undefined,
  dateFrom: item.dateFrom ?? undefined,
  dateTo: item.dateTo ?? undefined,
});

export const jobSeekerRoutes = new Elysia({ name: "job-seeker" })
  .get("/job-seeker/profile", async ({ headers, set }) => {
    const user = await getAuthUser(headers as Record<string, string | undefined>);
    if (!user) {
      set.status = 401;
      return apiError("UNAUTHORIZED", "Пользователь не авторизован");
    }
    const profile = await db.jobSeekerProfile.findUnique({ where: { userId: user.id } });
    if (!profile) {
      set.status = 404;
      return apiError("NOT_FOUND", "Профиль соискателя не найден");
    }
    return mapProfile(profile);
  }, {
    detail: { summary: "Профиль соискателя", tags: ["job-seeker"], security: [{ bearerAuth: [] }] },
    response: { 200: JobSeekerProfileDto, 401: ApiError, 404: ApiError },
  })
  .put("/job-seeker/profile", async ({ body, headers, set }) => {
    const user = await getAuthUser(headers as Record<string, string | undefined>);
    if (!user) {
      set.status = 401;
      return apiError("UNAUTHORIZED", "Пользователь не авторизован");
    }
    const profile = await db.jobSeekerProfile.upsert({
      where: { userId: user.id },
      update: body,
      create: { userId: user.id, firstName: body.firstName ?? "", lastName: body.lastName ?? "", phone: body.phone, city: body.city, bio: body.bio },
    });
    return mapProfile(profile);
  }, {
    detail: { summary: "Обновление профиля соискателя", tags: ["job-seeker"], security: [{ bearerAuth: [] }] },
    body: t.Object({ firstName: t.Optional(t.String()), lastName: t.Optional(t.String()), phone: t.Optional(t.String()), city: t.Optional(t.String()), bio: t.Optional(t.String()) }),
    response: { 200: JobSeekerProfileDto, 400: ApiError, 401: ApiError },
  })
  .get("/resumes", async ({ headers, set }) => {
    const user = await getAuthUser(headers as Record<string, string | undefined>);
    if (!user) {
      set.status = 401;
      return apiError("UNAUTHORIZED", "Пользователь не авторизован");
    }
    const items = await db.resume.findMany({ where: { userId: user.id }, orderBy: { id: "desc" } });
    return { items: items.map(mapResume) };
  }, {
    detail: { summary: "Список резюме текущего пользователя", tags: ["job-seeker"], security: [{ bearerAuth: [] }] },
    response: { 200: t.Object({ items: t.Array(ResumeDto) }), 401: ApiError },
  })
  .post("/resumes", async ({ body, headers, set }) => {
    const user = await getAuthUser(headers as Record<string, string | undefined>);
    if (!user) {
      set.status = 401;
      return apiError("UNAUTHORIZED", "Пользователь не авторизован");
    }
    const created = await db.resume.create({ data: { userId: user.id, title: body.title, summary: body.summary, isPublic: body.isPublic ?? false } });
    set.status = 201;
    return mapResume(created);
  }, {
    detail: { summary: "Создать резюме", tags: ["job-seeker"], security: [{ bearerAuth: [] }] },
    body: t.Object({ title: t.String(), summary: t.Optional(t.String()), isPublic: t.Optional(t.Boolean()) }),
    response: { 201: ResumeDto, 400: ApiError, 401: ApiError },
  })
  .get("/resumes/:resumeId", async ({ params, headers, set }) => {
    const user = await getAuthUser(headers as Record<string, string | undefined>);
    if (!user) {
      set.status = 401;
      return apiError("UNAUTHORIZED", "Пользователь не авторизован");
    }
    const resume = await db.resume.findUnique({ where: { id: params.resumeId } });
    if (!resume || resume.userId !== user.id) {
      set.status = 404;
      return apiError("NOT_FOUND", "Резюме не найдено");
    }
    return mapResume(resume);
  }, {
    detail: { summary: "Резюме по id", tags: ["job-seeker"], security: [{ bearerAuth: [] }] },
    params: t.Object({ resumeId: t.Numeric() }),
    response: { 200: ResumeDto, 401: ApiError, 404: ApiError },
  })
  .patch("/resumes/:resumeId", async ({ params, body, headers, set }) => {
    const user = await getAuthUser(headers as Record<string, string | undefined>);
    if (!user) {
      set.status = 401;
      return apiError("UNAUTHORIZED", "Пользователь не авторизован");
    }
    const resume = await db.resume.findUnique({ where: { id: params.resumeId } });
    if (!resume || resume.userId !== user.id) {
      set.status = 404;
      return apiError("NOT_FOUND", "Резюме не найдено");
    }
    const updated = await db.resume.update({ where: { id: params.resumeId }, data: body });
    return mapResume(updated);
  }, {
    detail: { summary: "Обновить резюме", tags: ["job-seeker"], security: [{ bearerAuth: [] }] },
    params: t.Object({ resumeId: t.Numeric() }),
    body: t.Object({ title: t.Optional(t.String()), summary: t.Optional(t.String()), isPublic: t.Optional(t.Boolean()) }),
    response: { 200: ResumeDto, 401: ApiError, 404: ApiError },
  })
  .delete("/resumes/:resumeId", async ({ params, headers, set }) => {
    const user = await getAuthUser(headers as Record<string, string | undefined>);
    if (!user) {
      set.status = 401;
      return apiError("UNAUTHORIZED", "Пользователь не авторизован");
    }
    const resume = await db.resume.findUnique({ where: { id: params.resumeId } });
    if (!resume || resume.userId !== user.id) {
      set.status = 404;
      return apiError("NOT_FOUND", "Резюме не найдено");
    }
    await db.resume.delete({ where: { id: params.resumeId } });
    return { deleted: true, id: params.resumeId };
  }, {
    detail: { summary: "Удалить резюме", tags: ["job-seeker"], security: [{ bearerAuth: [] }] },
    params: t.Object({ resumeId: t.Numeric() }),
    response: { 200: t.Object({ deleted: t.Boolean(), id: t.Number() }), 401: ApiError, 404: ApiError, 409: ApiError },
  })
  .get("/resumes/:resumeId/education", async ({ params }) => ({
    items: (await db.resumeEducation.findMany({ where: { resumeId: params.resumeId } })).map(mapEducation),
  }), {
    detail: { summary: "Блок образования резюме", tags: ["job-seeker"], security: [{ bearerAuth: [] }] },
    params: t.Object({ resumeId: t.Numeric() }),
    response: { 200: t.Object({ items: t.Array(ResumeEducationDto) }), 401: ApiError, 404: ApiError },
  })
  .post("/resumes/:resumeId/education", async ({ params, body, set }) => {
    const created = await db.resumeEducation.create({ data: { resumeId: params.resumeId, institution: body.institution, degree: body.degree, yearFrom: body.yearFrom, yearTo: body.yearTo } });
    set.status = 201;
    return mapEducation(created);
  }, {
    detail: { summary: "Добавить запись об образовании", tags: ["job-seeker"], security: [{ bearerAuth: [] }] },
    params: t.Object({ resumeId: t.Numeric() }),
    body: t.Object({ institution: t.String(), degree: t.Optional(t.String()), yearFrom: t.Optional(t.Number()), yearTo: t.Optional(t.Number()) }),
    response: { 201: ResumeEducationDto, 400: ApiError, 401: ApiError, 404: ApiError },
  })
  .patch("/resumes/:resumeId/education/:educationId", async ({ params, body }) => mapEducation(
    await db.resumeEducation.update({
      where: { id: params.educationId },
      data: {
        institution: body.institution ?? undefined,
        degree: body.degree ?? undefined,
        yearFrom: body.yearFrom ?? undefined,
        yearTo: body.yearTo ?? undefined,
      },
    })
  ), {
    detail: { summary: "Обновить запись об образовании", tags: ["job-seeker"], security: [{ bearerAuth: [] }] },
    params: t.Object({ resumeId: t.Numeric(), educationId: t.Numeric() }),
    body: t.Object({ institution: t.Optional(t.String()), degree: t.Optional(t.String()), yearFrom: t.Optional(t.Number()), yearTo: t.Optional(t.Number()) }),
    response: { 200: ResumeEducationDto, 401: ApiError, 404: ApiError },
  })
  .delete("/resumes/:resumeId/education/:educationId", async ({ params }) => {
    await db.resumeEducation.delete({ where: { id: params.educationId } });
    return { deleted: true, id: params.educationId };
  }, {
    detail: { summary: "Удалить запись об образовании", tags: ["job-seeker"], security: [{ bearerAuth: [] }] },
    params: t.Object({ resumeId: t.Numeric(), educationId: t.Numeric() }),
    response: { 200: t.Object({ deleted: t.Boolean(), id: t.Number() }), 401: ApiError, 404: ApiError },
  })
  .get("/resumes/:resumeId/work-experience", async ({ params }) => ({
    items: (await db.resumeWorkExperience.findMany({ where: { resumeId: params.resumeId } })).map(
      mapWorkExperience
    ),
  }), {
    detail: { summary: "Опыт работы в резюме", tags: ["job-seeker"], security: [{ bearerAuth: [] }] },
    params: t.Object({ resumeId: t.Numeric() }),
    response: { 200: t.Object({ items: t.Array(ResumeWorkExperienceDto) }), 401: ApiError, 404: ApiError },
  })
  .post("/resumes/:resumeId/work-experience", async ({ params, body, set }) => {
    const created = await db.resumeWorkExperience.create({ data: { resumeId: params.resumeId, companyName: body.companyName, position: body.position, description: body.description, dateFrom: body.dateFrom, dateTo: body.dateTo } });
    set.status = 201;
    return mapWorkExperience(created);
  }, {
    detail: { summary: "Добавить опыт работы", tags: ["job-seeker"], security: [{ bearerAuth: [] }] },
    params: t.Object({ resumeId: t.Numeric() }),
    body: t.Object({ companyName: t.String(), position: t.String(), description: t.Optional(t.String()), dateFrom: t.Optional(t.String({ format: "date" })), dateTo: t.Optional(t.String({ format: "date" })) }),
    response: { 201: ResumeWorkExperienceDto, 400: ApiError, 401: ApiError, 404: ApiError },
  })
  .patch("/resumes/:resumeId/work-experience/:workExperienceId", async ({ params, body }) => mapWorkExperience(
    await db.resumeWorkExperience.update({
      where: { id: params.workExperienceId },
      data: {
        companyName: body.companyName ?? undefined,
        position: body.position ?? undefined,
        description: body.description ?? undefined,
        dateFrom: body.dateFrom ?? undefined,
        dateTo: body.dateTo ?? undefined,
      },
    })
  ), {
    detail: { summary: "Обновить опыт работы", tags: ["job-seeker"], security: [{ bearerAuth: [] }] },
    params: t.Object({ resumeId: t.Numeric(), workExperienceId: t.Numeric() }),
    body: t.Object({ companyName: t.Optional(t.String()), position: t.Optional(t.String()), description: t.Optional(t.String()), dateFrom: t.Optional(t.String({ format: "date" })), dateTo: t.Optional(t.String({ format: "date" })) }),
    response: { 200: ResumeWorkExperienceDto, 401: ApiError, 404: ApiError },
  })
  .delete("/resumes/:resumeId/work-experience/:workExperienceId", async ({ params }) => {
    await db.resumeWorkExperience.delete({ where: { id: params.workExperienceId } });
    return { deleted: true, id: params.workExperienceId };
  }, {
    detail: { summary: "Удалить опыт работы", tags: ["job-seeker"], security: [{ bearerAuth: [] }] },
    params: t.Object({ resumeId: t.Numeric(), workExperienceId: t.Numeric() }),
    response: { 200: t.Object({ deleted: t.Boolean(), id: t.Number() }), 401: ApiError, 404: ApiError },
  })
  .put("/resumes/:resumeId/skills", async ({ params, body }) => {
    await db.resumeSkill.deleteMany({ where: { resumeId: params.resumeId } });
    if (body.skillIds.length) {
      await db.resumeSkill.createMany({
        data: body.skillIds.map((skillId) => ({ resumeId: params.resumeId, skillId })),
        skipDuplicates: true,
      });
    }
    const skills = await db.skill.findMany({ where: { id: { in: body.skillIds } } });
    return { resumeId: params.resumeId, skillIds: body.skillIds, skills };
  }, {
    detail: { summary: "Заменить набор навыков резюме", description: "Связь M:N с каталогом Skill; тело — полный список id.", tags: ["job-seeker"], security: [{ bearerAuth: [] }] },
    params: t.Object({ resumeId: t.Numeric() }),
    body: t.Object({ skillIds: t.Array(t.Number()) }),
    response: { 200: t.Object({ resumeId: t.Number(), skillIds: t.Array(t.Number()), skills: t.Array(SkillDto) }), 400: ApiError, 401: ApiError, 404: ApiError },
  });
