import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { env } from '../../common/env';
import { createServiceApp } from '../../common/createApp';
import {
  asyncHandler, authenticate, requireRole, validate, getPageParams, buildMeta,
} from '../../common/http';
import { HttpError } from '../../common/httpError';
import { UserRole, ApplicationStatus } from '../../common/enums';
import { callService } from '../../common/internalClient';
import { publishEvent } from '../../common/rabbit';
import { Application } from './entities/Application';

export const dataSource = new DataSource({
  type: 'postgres',
  host: env.db.host, port: env.db.port, username: env.db.user, password: env.db.password,
  database: env.db.name, synchronize: true, logging: false, entities: [Application],
});

const apps = () => dataSource.getRepository(Application);
const seekerOnly = requireRole(UserRole.SEEKER);
const employerOnly = requireRole(UserRole.EMPLOYER);
const enums = <T extends Record<string, string>>(e: T) => Object.values(e) as [string, ...string[]];

const present = (a: Application) => ({
  id: a.id, vacancy_id: a.vacancyId, resume_id: a.resumeId, cover_letter: a.coverLetter ?? null,
  status: a.status, created_at: a.createdAt, updated_at: a.updatedAt,
});

const seekerOfUser = async (userId: number): Promise<number> =>
  (await callService<{ id: number }>('seeker', `/internal/seekers/by-user/${userId}`))!.id;
const companyOfUser = async (userId: number): Promise<number | null> =>
  (await callService<{ company_id: number | null }>('employer', `/internal/employers/by-user/${userId}`))!.company_id;

const createSchema = z.object({
  resume_id: z.number().int().positive(), cover_letter: z.string().nullish(),
});
const statusSchema = z.object({ status: z.enum(enums(ApplicationStatus)) });

const routes = Router();

// ---------- создать отклик (соискатель) ----------
routes.post('/vacancies/:vacancyId/applications', authenticate, seekerOnly, validate(createSchema), asyncHandler(async (req: Request, res: Response) => {
  const vacancyId = Number(req.params.vacancyId);
  const { resume_id, cover_letter } = req.body;

  // межсервисная валидация: вакансия существует (Vacancy Service)
  const vacancy = await callService<{ id: number; company_id: number }>('vacancy', `/internal/vacancies/${vacancyId}`, { nullOn404: true });
  if (!vacancy) throw HttpError.notFound('Вакансия не найдена');

  // резюме существует и принадлежит соискателю (Seeker Service)
  const resume = await callService<{ id: number; job_seeker_id: number }>('seeker', `/internal/resumes/${resume_id}`, { nullOn404: true });
  if (!resume) throw HttpError.notFound('Резюме не найдено');
  const seekerId = await seekerOfUser(req.user!.id);
  if (resume.job_seeker_id !== seekerId) throw HttpError.forbidden('Это не ваше резюме');

  if (await apps().findOne({ where: { vacancyId, resumeId: resume_id } })) {
    throw HttpError.conflict('Отклик этим резюме на данную вакансию уже существует');
  }

  const application = apps().create({
    vacancyId, resumeId: resume_id, jobSeekerId: seekerId, companyId: vacancy.company_id,
    coverLetter: cover_letter ?? null,
  });
  await apps().save(application);

  // публикуем доменное событие в RabbitMQ (асинхронное межсервисное взаимодействие)
  await publishEvent('application.created', {
    application_id: application.id,
    vacancy_id: application.vacancyId,
    resume_id: application.resumeId,
    job_seeker_id: application.jobSeekerId,
    company_id: application.companyId,
    created_at: application.createdAt,
  });

  res.status(201).json(present(application));
}));

// ---------- отклики на вакансию (работодатель) ----------
routes.get('/vacancies/:vacancyId/applications', authenticate, employerOnly, asyncHandler(async (req: Request, res: Response) => {
  const vacancyId = Number(req.params.vacancyId);
  const vacancy = await callService<{ id: number; company_id: number }>('vacancy', `/internal/vacancies/${vacancyId}`, { nullOn404: true });
  if (!vacancy) throw HttpError.notFound('Вакансия не найдена');
  const companyId = await companyOfUser(req.user!.id);
  if (companyId !== vacancy.company_id) throw HttpError.forbidden('Вакансия принадлежит другой компании');

  const { page, limit, skip, take } = getPageParams(req.query);
  const where: Record<string, unknown> = { vacancyId };
  if (req.query.status) where.status = req.query.status;
  const [items, total] = await apps().findAndCount({ where, skip, take, order: { createdAt: 'DESC' } });
  res.json({ data: items.map(present), meta: buildMeta(page, limit, total) });
}));

// ---------- мои отклики (соискатель) ----------
routes.get('/applications', authenticate, seekerOnly, asyncHandler(async (req: Request, res: Response) => {
  const seekerId = await seekerOfUser(req.user!.id);
  const { page, limit, skip, take } = getPageParams(req.query);
  const where: Record<string, unknown> = { jobSeekerId: seekerId };
  if (req.query.status) where.status = req.query.status;
  const [items, total] = await apps().findAndCount({ where, skip, take, order: { createdAt: 'DESC' } });
  res.json({ data: items.map(present), meta: buildMeta(page, limit, total) });
}));

// ---------- получить отклик ----------
routes.get('/applications/:applicationId', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const a = await apps().findOne({ where: { id: Number(req.params.applicationId) } });
  if (!a) throw HttpError.notFound('Отклик не найден');
  if (req.user!.role === UserRole.SEEKER) {
    if (a.jobSeekerId !== await seekerOfUser(req.user!.id)) throw HttpError.forbidden();
  } else {
    if (a.companyId !== await companyOfUser(req.user!.id)) throw HttpError.forbidden();
  }
  res.json(present(a));
}));

// ---------- смена статуса (работодатель) ----------
routes.patch('/applications/:applicationId', authenticate, employerOnly, validate(statusSchema), asyncHandler(async (req: Request, res: Response) => {
  const a = await apps().findOne({ where: { id: Number(req.params.applicationId) } });
  if (!a) throw HttpError.notFound('Отклик не найден');
  if (a.companyId !== await companyOfUser(req.user!.id)) throw HttpError.forbidden();
  a.status = req.body.status;
  await apps().save(a);
  res.json(present(a));
}));

// ---------- отозвать отклик (соискатель) ----------
routes.delete('/applications/:applicationId', authenticate, seekerOnly, asyncHandler(async (req: Request, res: Response) => {
  const a = await apps().findOne({ where: { id: Number(req.params.applicationId) } });
  if (!a) throw HttpError.notFound('Отклик не найден');
  if (a.jobSeekerId !== await seekerOfUser(req.user!.id)) throw HttpError.forbidden();
  await apps().delete({ id: a.id });
  res.status(204).send();
}));

export const app = createServiceApp('application', routes);
