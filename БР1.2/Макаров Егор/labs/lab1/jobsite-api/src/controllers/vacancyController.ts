import { Request, Response } from 'express';
import { In } from 'typeorm';
import { repos } from '../repos';
import { HttpError } from '../utils/httpError';
import { currentEmployer } from './employerController';
import { getPageParams, buildMeta } from '../utils/pagination';
import { presentVacancy, presentVacancyDetail } from '../presenters';
import { Vacancy } from '../entities/Vacancy';

const loadSkills = async (ids?: number[]) => {
  if (!ids || ids.length === 0) return [];
  const skills = await repos.skill().findBy({ id: In(ids) });
  if (skills.length !== new Set(ids).size) {
    throw HttpError.validation('Некоторые навыки не найдены', [
      { field: 'skill_ids', message: 'Передан несуществующий skill_id' },
    ]);
  }
  return skills;
};

export const listVacancies = async (req: Request, res: Response): Promise<void> => {
  const { page, limit, skip, take } = getPageParams(req.query);
  const q = req.query;
  const qb = repos.vacancy().createQueryBuilder('v')
    .leftJoinAndSelect('v.company', 'company')
    .leftJoinAndSelect('company.industry', 'industry');

  if (q.q) qb.andWhere('(v.title ILIKE :q OR v.description ILIKE :q)', { q: `%${q.q}%` });
  if (q.industry_id) qb.andWhere('company.industry_id = :ind', { ind: Number(q.industry_id) });
  if (q.salary_from) qb.andWhere('v.salary_from >= :sf', { sf: Number(q.salary_from) });
  if (q.salary_to) qb.andWhere('v.salary_to <= :st', { st: Number(q.salary_to) });
  if (q.experience_years) qb.andWhere('v.experience_years <= :exp', { exp: Number(q.experience_years) });
  if (q.employment_type) qb.andWhere('v.employment_type = :et', { et: q.employment_type });
  if (q.schedule) qb.andWhere('v.schedule = :sch', { sch: q.schedule });
  if (q.city) qb.andWhere('v.city ILIKE :city', { city: `%${q.city}%` });
  if (q.company_id) qb.andWhere('v.company_id = :cid', { cid: Number(q.company_id) });

  if (q.skill_ids) {
    const ids = Array.isArray(q.skill_ids) ? q.skill_ids.map(Number) : [Number(q.skill_ids)];
    qb.andWhere((sub) => {
      const s = sub.subQuery()
        .select('vs.vacancy_id')
        .from('vacancy_skills', 'vs')
        .where('vs.skill_id IN (:...ids)')
        .getQuery();
      return `v.id IN ${s}`;
    }).setParameter('ids', ids);
  }

  const sort = String(q.sort || '-created_at');
  const sortMap: Record<string, [string, 'ASC' | 'DESC']> = {
    'created_at': ['v.created_at', 'ASC'],
    '-created_at': ['v.created_at', 'DESC'],
    'salary_from': ['v.salary_from', 'ASC'],
    '-salary_from': ['v.salary_from', 'DESC'],
  };
  const [col, dir] = sortMap[sort] || sortMap['-created_at'];
  qb.orderBy(col, dir).offset(skip).limit(take);

  const [items, total] = await qb.getManyAndCount();
  res.json({ data: items.map(presentVacancy), meta: buildMeta(page, limit, total) });
};

export const getVacancy = async (req: Request, res: Response): Promise<void> => {
  const vacancy = await repos.vacancy().findOne({
    where: { id: Number(req.params.vacancyId) },
    relations: ['company', 'company.industry', 'skills'],
  });
  if (!vacancy) throw HttpError.notFound('Вакансия не найдена');
  res.json(presentVacancyDetail(vacancy));
};

const assertVacancyAccess = async (userId: number, vacancy: Vacancy): Promise<void> => {
  const employer = await currentEmployer(userId);
  if (!employer.companyId || employer.companyId !== vacancy.companyId) {
    throw HttpError.forbidden('Вакансия принадлежит другой компании');
  }
};

export const createVacancy = async (req: Request, res: Response): Promise<void> => {
  const employer = await currentEmployer(req.user!.id);
  const b = req.body;
  if (employer.companyId !== b.company_id) {
    throw HttpError.forbidden('Можно создавать вакансии только для своей компании');
  }
  const vacancy = repos.vacancy().create({
    companyId: b.company_id,
    employerId: employer.id,
    title: b.title,
    description: b.description ?? null,
    requirements: b.requirements ?? null,
    salaryFrom: b.salary_from ?? null,
    salaryTo: b.salary_to ?? null,
    currency: b.currency ?? 'RUB',
    experienceYears: b.experience_years ?? null,
    employmentType: b.employment_type ?? null,
    schedule: b.schedule ?? null,
    city: b.city ?? null,
    status: b.status ?? undefined,
    skills: await loadSkills(b.skill_ids),
  });
  await repos.vacancy().save(vacancy);
  const reloaded = await repos.vacancy().findOne({
    where: { id: vacancy.id }, relations: ['company', 'company.industry', 'skills'],
  });
  res.status(201).json(presentVacancyDetail(reloaded!));
};

export const updateVacancy = async (req: Request, res: Response): Promise<void> => {
  const id = Number(req.params.vacancyId);
  const vacancy = await repos.vacancy().findOne({ where: { id }, relations: ['skills'] });
  if (!vacancy) throw HttpError.notFound('Вакансия не найдена');
  await assertVacancyAccess(req.user!.id, vacancy);

  const b = req.body;
  vacancy.companyId = b.company_id;
  vacancy.title = b.title;
  vacancy.description = b.description ?? null;
  vacancy.requirements = b.requirements ?? null;
  vacancy.salaryFrom = b.salary_from ?? null;
  vacancy.salaryTo = b.salary_to ?? null;
  if (b.currency) vacancy.currency = b.currency;
  vacancy.experienceYears = b.experience_years ?? null;
  vacancy.employmentType = b.employment_type ?? null;
  vacancy.schedule = b.schedule ?? null;
  vacancy.city = b.city ?? null;
  if (b.status) vacancy.status = b.status;
  if (b.skill_ids) vacancy.skills = await loadSkills(b.skill_ids);
  await repos.vacancy().save(vacancy);

  const reloaded = await repos.vacancy().findOne({
    where: { id }, relations: ['company', 'company.industry', 'skills'],
  });
  res.json(presentVacancyDetail(reloaded!));
};

export const deleteVacancy = async (req: Request, res: Response): Promise<void> => {
  const id = Number(req.params.vacancyId);
  const vacancy = await repos.vacancy().findOne({ where: { id } });
  if (!vacancy) throw HttpError.notFound('Вакансия не найдена');
  await assertVacancyAccess(req.user!.id, vacancy);
  await repos.vacancy().delete({ id });
  res.status(204).send();
};
