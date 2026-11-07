import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { env } from '../../common/env';
import { createServiceApp } from '../../common/createApp';
import {
  asyncHandler, authenticate, requireRole, validate, internalOnly, getPageParams, buildMeta,
} from '../../common/http';
import { HttpError } from '../../common/httpError';
import { UserRole, EmploymentType, Schedule, ResumeStatus } from '../../common/enums';
import { callService } from '../../common/internalClient';
import { JobSeeker } from './entities/JobSeeker';
import { Resume } from './entities/Resume';
import { WorkExperience } from './entities/WorkExperience';
import { Education } from './entities/Education';
import { ResumeSkill } from './entities/ResumeSkill';

export const dataSource = new DataSource({
  type: 'postgres',
  host: env.db.host, port: env.db.port, username: env.db.user, password: env.db.password,
  database: env.db.name, synchronize: true, logging: false,
  entities: [JobSeeker, Resume, WorkExperience, Education, ResumeSkill],
});

const seekers = () => dataSource.getRepository(JobSeeker);
const resumes = () => dataSource.getRepository(Resume);
const works = () => dataSource.getRepository(WorkExperience);
const edus = () => dataSource.getRepository(Education);
const resumeSkills = () => dataSource.getRepository(ResumeSkill);

const seekerOnly = requireRole(UserRole.SEEKER);
const enums = <T extends Record<string, string>>(e: T) => Object.values(e) as [string, ...string[]];

// ---------- presenters ----------
const presentSeeker = (s: JobSeeker) => ({
  id: s.id, user_id: s.userId, first_name: s.firstName, last_name: s.lastName,
  phone: s.phone ?? null, city: s.city ?? null, avatar_url: s.avatarUrl ?? null,
  about: s.about ?? null, created_at: s.createdAt,
});
const presentResume = (r: Resume) => ({
  id: r.id, job_seeker_id: r.jobSeekerId, title: r.title, salary_expected: r.salaryExpected ?? null,
  currency: r.currency, employment_type: r.employmentType ?? null, schedule: r.schedule ?? null,
  status: r.status, created_at: r.createdAt, updated_at: r.updatedAt,
});
const presentWork = (w: WorkExperience) => ({
  id: w.id, resume_id: w.resumeId, company_name: w.companyName, position: w.position,
  start_date: w.startDate, end_date: w.endDate ?? null, is_current: w.isCurrent, description: w.description ?? null,
});
const presentEdu = (e: Education) => ({
  id: e.id, resume_id: e.resumeId, institution: e.institution, degree: e.degree ?? null,
  field_of_study: e.fieldOfStudy ?? null, start_year: e.startYear, end_year: e.endYear ?? null,
});

// ---------- helpers ----------
const currentSeeker = async (userId: number): Promise<JobSeeker> => {
  const s = await seekers().findOne({ where: { userId } });
  if (!s) throw HttpError.notFound('Профиль соискателя не найден');
  return s;
};

// получить названия навыков из Catalog Service
const fetchSkills = async (ids: number[]): Promise<{ id: number; name: string }[]> => {
  if (ids.length === 0) return [];
  const qs = ids.map((i) => `ids=${i}`).join('&');
  const data = await callService<{ id: number; name: string }[]>('catalog', `/internal/skills?${qs}`);
  return data ?? [];
};

// проверить существование навыков и вернуть валидный список id
const validateSkillIds = async (ids?: number[]): Promise<number[]> => {
  if (!ids || ids.length === 0) return [];
  const unique = [...new Set(ids)];
  const found = await fetchSkills(unique);
  if (found.length !== unique.length) {
    throw HttpError.validation('Некоторые навыки не найдены', [{ field: 'skill_ids', message: 'Передан несуществующий skill_id' }]);
  }
  return unique;
};

const ownedResume = async (userId: number, resumeId: number): Promise<Resume> => {
  const resume = await resumes().findOne({ where: { id: resumeId } });
  if (!resume) throw HttpError.notFound('Резюме не найдено');
  const seeker = await currentSeeker(userId);
  if (resume.jobSeekerId !== seeker.id) throw HttpError.forbidden('Это не ваше резюме');
  return resume;
};

// ---------- schemas ----------
const seekerSchema = z.object({
  first_name: z.string().min(1).max(100), last_name: z.string().min(1).max(100),
  phone: z.string().max(20).nullish(), city: z.string().max(100).nullish(),
  avatar_url: z.string().url().nullish(), about: z.string().nullish(),
});
const resumeSchema = z.object({
  title: z.string().min(1).max(255),
  salary_expected: z.number().int().min(0).nullish(),
  currency: z.string().max(10).optional(),
  employment_type: z.enum(enums(EmploymentType)).nullish(),
  schedule: z.enum(enums(Schedule)).nullish(),
  status: z.enum(enums(ResumeStatus)).optional(),
  skill_ids: z.array(z.number().int().positive()).optional(),
});
const skillIdsSchema = z.object({ skill_ids: z.array(z.number().int().positive()) });
const workSchema = z.object({
  company_name: z.string().min(1).max(255), position: z.string().min(1).max(255),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullish(),
  is_current: z.boolean().optional(), description: z.string().nullish(),
});
const eduSchema = z.object({
  institution: z.string().min(1).max(255), degree: z.string().max(100).nullish(),
  field_of_study: z.string().max(255).nullish(), start_year: z.number().int(), end_year: z.number().int().nullish(),
});

const routes = Router();

// ---------- profile ----------
routes.get('/seeker/profile', authenticate, seekerOnly, asyncHandler(async (req: Request, res: Response) => {
  res.json(presentSeeker(await currentSeeker(req.user!.id)));
}));

routes.put('/seeker/profile', authenticate, seekerOnly, validate(seekerSchema), asyncHandler(async (req: Request, res: Response) => {
  const s = await currentSeeker(req.user!.id);
  const b = req.body;
  Object.assign(s, {
    firstName: b.first_name, lastName: b.last_name, phone: b.phone ?? null,
    city: b.city ?? null, avatarUrl: b.avatar_url ?? null, about: b.about ?? null,
  });
  await seekers().save(s);
  res.json(presentSeeker(s));
}));

routes.get('/seekers/:seekerId', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const s = await seekers().findOne({ where: { id: Number(req.params.seekerId) } });
  if (!s) throw HttpError.notFound('Соискатель не найден');
  res.json(presentSeeker(s));
}));

// ---------- resumes ----------
routes.get('/resumes', authenticate, seekerOnly, asyncHandler(async (req: Request, res: Response) => {
  const seeker = await currentSeeker(req.user!.id);
  const { page, limit, skip, take } = getPageParams(req.query);
  const where: Record<string, unknown> = { jobSeekerId: seeker.id };
  if (req.query.status) where.status = req.query.status;
  const [items, total] = await resumes().findAndCount({ where, skip, take, order: { createdAt: 'DESC' } });
  res.json({ data: items.map(presentResume), meta: buildMeta(page, limit, total) });
}));

routes.post('/resumes', authenticate, seekerOnly, validate(resumeSchema), asyncHandler(async (req: Request, res: Response) => {
  const seeker = await currentSeeker(req.user!.id);
  const b = req.body;
  const skillIds = await validateSkillIds(b.skill_ids);
  const resume = resumes().create({
    jobSeekerId: seeker.id, title: b.title, salaryExpected: b.salary_expected ?? null,
    currency: b.currency ?? 'RUB', employmentType: b.employment_type ?? null,
    schedule: b.schedule ?? null, status: b.status ?? undefined,
    resumeSkills: skillIds.map((id) => resumeSkills().create({ skillId: id })),
  });
  await resumes().save(resume);
  res.status(201).json(presentResume(resume));
}));

routes.get('/resumes/:resumeId', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const resume = await resumes().findOne({
    where: { id: Number(req.params.resumeId) },
    relations: ['workExperiences', 'educations', 'resumeSkills'],
  });
  if (!resume) throw HttpError.notFound('Резюме не найдено');
  const skills = await fetchSkills((resume.resumeSkills ?? []).map((rs) => rs.skillId));
  res.json({
    ...presentResume(resume),
    skills,
    work_experiences: (resume.workExperiences ?? []).map(presentWork),
    educations: (resume.educations ?? []).map(presentEdu),
  });
}));

routes.put('/resumes/:resumeId', authenticate, seekerOnly, validate(resumeSchema), asyncHandler(async (req: Request, res: Response) => {
  const resume = await ownedResume(req.user!.id, Number(req.params.resumeId));
  const b = req.body;
  Object.assign(resume, {
    title: b.title, salaryExpected: b.salary_expected ?? null, employmentType: b.employment_type ?? null,
    schedule: b.schedule ?? null,
  });
  if (b.currency) resume.currency = b.currency;
  if (b.status) resume.status = b.status;
  if (b.skill_ids) {
    const ids = await validateSkillIds(b.skill_ids);
    await resumeSkills().delete({ resumeId: resume.id });
    resume.resumeSkills = ids.map((id) => resumeSkills().create({ resumeId: resume.id, skillId: id }));
  }
  await resumes().save(resume);
  res.json(presentResume(resume));
}));

routes.delete('/resumes/:resumeId', authenticate, seekerOnly, asyncHandler(async (req: Request, res: Response) => {
  await ownedResume(req.user!.id, Number(req.params.resumeId));
  await resumes().delete({ id: Number(req.params.resumeId) });
  res.status(204).send();
}));

routes.put('/resumes/:resumeId/skills', authenticate, seekerOnly, validate(skillIdsSchema), asyncHandler(async (req: Request, res: Response) => {
  const resume = await ownedResume(req.user!.id, Number(req.params.resumeId));
  const ids = await validateSkillIds(req.body.skill_ids);
  await resumeSkills().delete({ resumeId: resume.id });
  await resumeSkills().save(ids.map((id) => resumeSkills().create({ resumeId: resume.id, skillId: id })));
  res.json(await fetchSkills(ids));
}));

// ---------- work experiences ----------
routes.get('/resumes/:resumeId/work-experiences', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const items = await works().find({ where: { resumeId: Number(req.params.resumeId) }, order: { startDate: 'DESC' } });
  res.json(items.map(presentWork));
}));
routes.post('/resumes/:resumeId/work-experiences', authenticate, seekerOnly, validate(workSchema), asyncHandler(async (req: Request, res: Response) => {
  const resume = await ownedResume(req.user!.id, Number(req.params.resumeId));
  const b = req.body;
  const w = works().create({
    resumeId: resume.id, companyName: b.company_name, position: b.position, startDate: b.start_date,
    endDate: b.end_date ?? null, isCurrent: b.is_current ?? false, description: b.description ?? null,
  });
  await works().save(w);
  res.status(201).json(presentWork(w));
}));
const ownedWork = async (userId: number, id: number) => {
  const w = await works().findOne({ where: { id } });
  if (!w) throw HttpError.notFound('Запись об опыте не найдена');
  await ownedResume(userId, w.resumeId);
  return w;
};
routes.put('/work-experiences/:id', authenticate, seekerOnly, validate(workSchema), asyncHandler(async (req: Request, res: Response) => {
  const w = await ownedWork(req.user!.id, Number(req.params.id));
  const b = req.body;
  Object.assign(w, {
    companyName: b.company_name, position: b.position, startDate: b.start_date,
    endDate: b.end_date ?? null, isCurrent: b.is_current ?? false, description: b.description ?? null,
  });
  await works().save(w);
  res.json(presentWork(w));
}));
routes.delete('/work-experiences/:id', authenticate, seekerOnly, asyncHandler(async (req: Request, res: Response) => {
  await ownedWork(req.user!.id, Number(req.params.id));
  await works().delete({ id: Number(req.params.id) });
  res.status(204).send();
}));

// ---------- educations ----------
routes.get('/resumes/:resumeId/educations', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const items = await edus().find({ where: { resumeId: Number(req.params.resumeId) }, order: { startYear: 'DESC' } });
  res.json(items.map(presentEdu));
}));
routes.post('/resumes/:resumeId/educations', authenticate, seekerOnly, validate(eduSchema), asyncHandler(async (req: Request, res: Response) => {
  const resume = await ownedResume(req.user!.id, Number(req.params.resumeId));
  const b = req.body;
  const e = edus().create({
    resumeId: resume.id, institution: b.institution, degree: b.degree ?? null,
    fieldOfStudy: b.field_of_study ?? null, startYear: b.start_year, endYear: b.end_year ?? null,
  });
  await edus().save(e);
  res.status(201).json(presentEdu(e));
}));
const ownedEdu = async (userId: number, id: number) => {
  const e = await edus().findOne({ where: { id } });
  if (!e) throw HttpError.notFound('Запись об образовании не найдена');
  await ownedResume(userId, e.resumeId);
  return e;
};
routes.put('/educations/:id', authenticate, seekerOnly, validate(eduSchema), asyncHandler(async (req: Request, res: Response) => {
  const e = await ownedEdu(req.user!.id, Number(req.params.id));
  const b = req.body;
  Object.assign(e, {
    institution: b.institution, degree: b.degree ?? null, fieldOfStudy: b.field_of_study ?? null,
    startYear: b.start_year, endYear: b.end_year ?? null,
  });
  await edus().save(e);
  res.json(presentEdu(e));
}));
routes.delete('/educations/:id', authenticate, seekerOnly, asyncHandler(async (req: Request, res: Response) => {
  await ownedEdu(req.user!.id, Number(req.params.id));
  await edus().delete({ id: Number(req.params.id) });
  res.status(204).send();
}));

// ---------- internal ----------
const internal = Router();
internal.use(internalOnly);

internal.post('/seekers', asyncHandler(async (req: Request, res: Response) => {
  const { user_id, first_name, last_name } = req.body;
  const seeker = seekers().create({ userId: user_id, firstName: first_name, lastName: last_name });
  await seekers().save(seeker);
  res.status(201).json(presentSeeker(seeker));
}));

internal.get('/seekers/by-user/:userId', asyncHandler(async (req: Request, res: Response) => {
  const s = await seekers().findOne({ where: { userId: Number(req.params.userId) } });
  if (!s) throw HttpError.notFound();
  res.json({ id: s.id, user_id: s.userId });
}));

internal.get('/seekers/:id', asyncHandler(async (req: Request, res: Response) => {
  const s = await seekers().findOne({ where: { id: Number(req.params.id) } });
  if (!s) throw HttpError.notFound();
  res.json({ id: s.id, user_id: s.userId, first_name: s.firstName, last_name: s.lastName });
}));

internal.get('/resumes/:id', asyncHandler(async (req: Request, res: Response) => {
  const r = await resumes().findOne({ where: { id: Number(req.params.id) } });
  if (!r) throw HttpError.notFound();
  res.json({ id: r.id, job_seeker_id: r.jobSeekerId, title: r.title });
}));

export const app = createServiceApp('seeker', routes, internal);
