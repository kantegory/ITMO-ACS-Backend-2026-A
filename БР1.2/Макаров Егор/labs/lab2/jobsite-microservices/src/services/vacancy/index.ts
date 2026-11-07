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
import { UserRole, EmploymentType, Schedule, VacancyStatus } from '../../common/enums';
import { callService } from '../../common/internalClient';
import { Vacancy } from './entities/Vacancy';
import { VacancySkill } from './entities/VacancySkill';
import { SavedVacancy } from './entities/SavedVacancy';

export const dataSource = new DataSource({
  type: 'postgres',
  host: env.db.host, port: env.db.port, username: env.db.user, password: env.db.password,
  database: env.db.name, synchronize: true, logging: false, entities: [Vacancy, VacancySkill, SavedVacancy],
});

const vacancies = () => dataSource.getRepository(Vacancy);
const vacancySkills = () => dataSource.getRepository(VacancySkill);
const saved = () => dataSource.getRepository(SavedVacancy);
const employerOnly = requireRole(UserRole.EMPLOYER);
const seekerOnly = requireRole(UserRole.SEEKER);
const enums = <T extends Record<string, string>>(e: T) => Object.values(e) as [string, ...string[]];

const fetchSkills = async (ids: number[]) => {
  if (ids.length === 0) return [];
  const qs = ids.map((i) => `ids=${i}`).join('&');
  return (await callService<{ id: number; name: string }[]>('catalog', `/internal/skills?${qs}`)) ?? [];
};
const validateSkillIds = async (ids?: number[]): Promise<number[]> => {
  if (!ids || ids.length === 0) return [];
  const unique = [...new Set(ids)];
  const found = await fetchSkills(unique);
  if (found.length !== unique.length) {
    throw HttpError.validation('Некоторые навыки не найдены', [{ field: 'skill_ids', message: 'Передан несуществующий skill_id' }]);
  }
  return unique;
};

const presentVacancy = (v: Vacancy) => ({
  id: v.id, company_id: v.companyId, employer_id: v.employerId ?? null, title: v.title,
  salary_from: v.salaryFrom ?? null, salary_to: v.salaryTo ?? null, currency: v.currency,
  experience_years: v.experienceYears ?? null, employment_type: v.employmentType ?? null,
  schedule: v.schedule ?? null, city: v.city ?? null, status: v.status,
  created_at: v.createdAt, updated_at: v.updatedAt,
});

// детальная вакансия: подтягивает компанию (Employer) и навыки (Catalog)
const presentVacancyDetail = async (v: Vacancy, skillIds: number[]) => {
  const companyRaw = await callService<{ id: number; name: string; industry_id: number | null }>(
    'employer', `/internal/companies/${v.companyId}`, { nullOn404: true });
  let company = null;
  if (companyRaw) {
    const industry = companyRaw.industry_id
      ? await callService<{ id: number; name: string }>('catalog', `/internal/industries/${companyRaw.industry_id}`, { nullOn404: true })
      : null;
    company = { id: companyRaw.id, name: companyRaw.name, industry };
  }
  return {
    ...presentVacancy(v),
    description: v.description ?? null,
    requirements: v.requirements ?? null,
    company,
    skills: await fetchSkills(skillIds),
  };
};

const vacancySchema = z.object({
  company_id: z.number().int().positive(), title: z.string().min(1).max(255),
  description: z.string().nullish(), requirements: z.string().nullish(),
  salary_from: z.number().int().min(0).nullish(), salary_to: z.number().int().min(0).nullish(),
  currency: z.string().max(10).optional(), experience_years: z.number().int().min(0).nullish(),
  employment_type: z.enum(enums(EmploymentType)).nullish(), schedule: z.enum(enums(Schedule)).nullish(),
  city: z.string().max(100).nullish(), status: z.enum(enums(VacancyStatus)).optional(),
  skill_ids: z.array(z.number().int().positive()).optional(),
});
const saveSchema = z.object({ vacancy_id: z.number().int().positive() });

// получить employer_id и company_id текущего пользователя из Employer Service
const employerOfUser = async (userId: number): Promise<{ employer_id: number; company_id: number | null }> => {
  const data = await callService<{ employer_id: number; company_id: number | null }>(
    'employer', `/internal/employers/by-user/${userId}`);
  return data!;
};
const seekerOfUser = async (userId: number): Promise<number> => {
  const data = await callService<{ id: number }>('seeker', `/internal/seekers/by-user/${userId}`);
  return data!.id;
};

const routes = Router();

// ---------- search ----------
routes.get('/vacancies', asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip, take } = getPageParams(req.query);
  const q = req.query;
  const qb = vacancies().createQueryBuilder('v');
  if (q.q) qb.andWhere('(v.title ILIKE :q OR v.description ILIKE :q)', { q: `%${q.q}%` });
  if (q.industry_id) qb.andWhere('v.industry_id = :ind', { ind: Number(q.industry_id) });
  if (q.salary_from) qb.andWhere('v.salary_from >= :sf', { sf: Number(q.salary_from) });
  if (q.salary_to) qb.andWhere('v.salary_to <= :st', { st: Number(q.salary_to) });
  if (q.experience_years) qb.andWhere('v.experience_years <= :exp', { exp: Number(q.experience_years) });
  if (q.employment_type) qb.andWhere('v.employment_type = :et', { et: q.employment_type });
  if (q.schedule) qb.andWhere('v.schedule = :sch', { sch: q.schedule });
  if (q.city) qb.andWhere('v.city ILIKE :city', { city: `%${q.city}%` });
  if (q.company_id) qb.andWhere('v.company_id = :cid', { cid: Number(q.company_id) });
  if (q.skill_ids) {
    const ids = (Array.isArray(q.skill_ids) ? q.skill_ids : [q.skill_ids]).map(Number);
    qb.andWhere((sub) => {
      const s = sub.subQuery().select('vs.vacancy_id').from('vacancy_skills', 'vs')
        .where('vs.skill_id IN (:...ids)').getQuery();
      return `v.id IN ${s}`;
    }).setParameter('ids', ids);
  }
  const sortMap: Record<string, [string, 'ASC' | 'DESC']> = {
    'created_at': ['v.created_at', 'ASC'], '-created_at': ['v.created_at', 'DESC'],
    'salary_from': ['v.salary_from', 'ASC'], '-salary_from': ['v.salary_from', 'DESC'],
  };
  const [col, dir] = sortMap[String(q.sort || '-created_at')] || sortMap['-created_at'];
  qb.orderBy(col, dir).offset(skip).limit(take);
  const [items, total] = await qb.getManyAndCount();
  res.json({ data: items.map(presentVacancy), meta: buildMeta(page, limit, total) });
}));

routes.get('/vacancies/:vacancyId', asyncHandler(async (req: Request, res: Response) => {
  const v = await vacancies().findOne({ where: { id: Number(req.params.vacancyId) }, relations: ['vacancySkills'] });
  if (!v) throw HttpError.notFound('Вакансия не найдена');
  res.json(await presentVacancyDetail(v, (v.vacancySkills ?? []).map((vs) => vs.skillId)));
}));

routes.post('/vacancies', authenticate, employerOnly, validate(vacancySchema), asyncHandler(async (req: Request, res: Response) => {
  const b = req.body;
  const employer = await employerOfUser(req.user!.id);
  if (employer.company_id !== b.company_id) {
    throw HttpError.forbidden('Можно создавать вакансии только для своей компании');
  }
  // денормализуем отрасль компании для фильтрации
  const company = await callService<{ industry_id: number | null }>('employer', `/internal/companies/${b.company_id}`, { nullOn404: true });
  const skillIds = await validateSkillIds(b.skill_ids);
  const vacancy = vacancies().create({
    companyId: b.company_id, employerId: employer.employer_id, industryId: company?.industry_id ?? null,
    title: b.title, description: b.description ?? null, requirements: b.requirements ?? null,
    salaryFrom: b.salary_from ?? null, salaryTo: b.salary_to ?? null, currency: b.currency ?? 'RUB',
    experienceYears: b.experience_years ?? null, employmentType: b.employment_type ?? null,
    schedule: b.schedule ?? null, city: b.city ?? null, status: b.status ?? undefined,
    vacancySkills: skillIds.map((id) => vacancySkills().create({ skillId: id })),
  });
  await vacancies().save(vacancy);
  res.status(201).json(await presentVacancyDetail(vacancy, skillIds));
}));

const assertVacancyAccess = async (userId: number, v: Vacancy) => {
  const employer = await employerOfUser(userId);
  if (!employer.company_id || employer.company_id !== v.companyId) {
    throw HttpError.forbidden('Вакансия принадлежит другой компании');
  }
};

routes.put('/vacancies/:vacancyId', authenticate, employerOnly, validate(vacancySchema), asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.vacancyId);
  const v = await vacancies().findOne({ where: { id }, relations: ['vacancySkills'] });
  if (!v) throw HttpError.notFound('Вакансия не найдена');
  await assertVacancyAccess(req.user!.id, v);
  const b = req.body;
  Object.assign(v, {
    companyId: b.company_id, title: b.title, description: b.description ?? null, requirements: b.requirements ?? null,
    salaryFrom: b.salary_from ?? null, salaryTo: b.salary_to ?? null, experienceYears: b.experience_years ?? null,
    employmentType: b.employment_type ?? null, schedule: b.schedule ?? null, city: b.city ?? null,
  });
  if (b.currency) v.currency = b.currency;
  if (b.status) v.status = b.status;
  let skillIds = (v.vacancySkills ?? []).map((vs) => vs.skillId);
  if (b.skill_ids) {
    skillIds = await validateSkillIds(b.skill_ids);
    await vacancySkills().delete({ vacancyId: v.id });
    v.vacancySkills = skillIds.map((sid) => vacancySkills().create({ vacancyId: v.id, skillId: sid }));
  }
  await vacancies().save(v);
  res.json(await presentVacancyDetail(v, skillIds));
}));

routes.delete('/vacancies/:vacancyId', authenticate, employerOnly, asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.vacancyId);
  const v = await vacancies().findOne({ where: { id } });
  if (!v) throw HttpError.notFound('Вакансия не найдена');
  await assertVacancyAccess(req.user!.id, v);
  await vacancies().delete({ id });
  res.status(204).send();
}));

// ---------- saved vacancies ----------
routes.get('/seeker/saved-vacancies', authenticate, seekerOnly, asyncHandler(async (req: Request, res: Response) => {
  const seekerId = await seekerOfUser(req.user!.id);
  const { page, limit, skip, take } = getPageParams(req.query);
  const [items, total] = await saved().findAndCount({ where: { jobSeekerId: seekerId }, skip, take, order: { createdAt: 'DESC' } });
  const list = await vacancies().findByIds(items.map((s) => s.vacancyId));
  res.json({ data: list.map(presentVacancy), meta: buildMeta(page, limit, total) });
}));

routes.post('/seeker/saved-vacancies', authenticate, seekerOnly, validate(saveSchema), asyncHandler(async (req: Request, res: Response) => {
  const seekerId = await seekerOfUser(req.user!.id);
  const vacancyId = req.body.vacancy_id;
  if (!(await vacancies().findOne({ where: { id: vacancyId } }))) throw HttpError.notFound('Вакансия не найдена');
  if (await saved().findOne({ where: { jobSeekerId: seekerId, vacancyId } })) throw HttpError.conflict('Вакансия уже в избранном');
  await saved().save(saved().create({ jobSeekerId: seekerId, vacancyId }));
  res.status(201).json({ job_seeker_id: seekerId, vacancy_id: vacancyId });
}));

routes.delete('/seeker/saved-vacancies/:vacancyId', authenticate, seekerOnly, asyncHandler(async (req: Request, res: Response) => {
  const seekerId = await seekerOfUser(req.user!.id);
  const vacancyId = Number(req.params.vacancyId);
  if (!(await saved().findOne({ where: { jobSeekerId: seekerId, vacancyId } }))) throw HttpError.notFound('Вакансия не найдена в избранном');
  await saved().delete({ jobSeekerId: seekerId, vacancyId });
  res.status(204).send();
}));

// ---------- internal ----------
const internal = Router();
internal.use(internalOnly);
internal.get('/vacancies/:id', asyncHandler(async (req: Request, res: Response) => {
  const v = await vacancies().findOne({ where: { id: Number(req.params.id) } });
  if (!v) throw HttpError.notFound();
  res.json({ id: v.id, company_id: v.companyId, employer_id: v.employerId ?? null, title: v.title, status: v.status });
}));

export const app = createServiceApp('vacancy', routes, internal);
