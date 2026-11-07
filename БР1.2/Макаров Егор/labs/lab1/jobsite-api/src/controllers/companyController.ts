import { Request, Response } from 'express';
import { repos } from '../repos';
import { HttpError } from '../utils/httpError';
import { currentEmployer } from './employerController';
import { getPageParams, buildMeta } from '../utils/pagination';
import { presentCompany } from '../presenters';

export const listCompanies = async (req: Request, res: Response): Promise<void> => {
  const { page, limit, skip, take } = getPageParams(req.query);
  const qb = repos.company().createQueryBuilder('c').leftJoinAndSelect('c.industry', 'industry');
  if (req.query.industry_id) qb.andWhere('c.industry_id = :ind', { ind: Number(req.query.industry_id) });
  if (req.query.city) qb.andWhere('c.city ILIKE :city', { city: `%${req.query.city}%` });
  if (req.query.size) qb.andWhere('c.size = :size', { size: req.query.size });
  qb.orderBy('c.created_at', 'DESC').offset(skip).limit(take);
  const [items, total] = await qb.getManyAndCount();
  res.json({ data: items.map(presentCompany), meta: buildMeta(page, limit, total) });
};

export const getCompany = async (req: Request, res: Response): Promise<void> => {
  const company = await repos.company().findOne({
    where: { id: Number(req.params.companyId) },
    relations: ['industry'],
  });
  if (!company) throw HttpError.notFound('Компания не найдена');
  res.json(presentCompany(company));
};

export const createCompany = async (req: Request, res: Response): Promise<void> => {
  const employer = await currentEmployer(req.user!.id);
  const b = req.body;
  const company = repos.company().create({
    name: b.name,
    description: b.description ?? null,
    logoUrl: b.logo_url ?? null,
    website: b.website ?? null,
    industryId: b.industry_id ?? null,
    size: b.size ?? null,
    city: b.city ?? null,
  });
  await repos.company().save(company);

  // привязываем создателя к компании, если он ещё не привязан
  if (!employer.companyId) {
    employer.companyId = company.id;
    await repos.employer().save(employer);
  }

  const reloaded = await repos.company().findOne({ where: { id: company.id }, relations: ['industry'] });
  res.status(201).json(presentCompany(reloaded!));
};

// проверяет, что текущий работодатель принадлежит компании
const assertCompanyAccess = async (userId: number, companyId: number): Promise<void> => {
  const employer = await currentEmployer(userId);
  if (employer.companyId !== companyId) {
    throw HttpError.forbidden('Вы не относитесь к этой компании');
  }
};

export const updateCompany = async (req: Request, res: Response): Promise<void> => {
  const id = Number(req.params.companyId);
  const company = await repos.company().findOne({ where: { id } });
  if (!company) throw HttpError.notFound('Компания не найдена');
  await assertCompanyAccess(req.user!.id, id);

  const b = req.body;
  company.name = b.name;
  company.description = b.description ?? null;
  company.logoUrl = b.logo_url ?? null;
  company.website = b.website ?? null;
  company.industryId = b.industry_id ?? null;
  company.size = b.size ?? null;
  company.city = b.city ?? null;
  await repos.company().save(company);

  const reloaded = await repos.company().findOne({ where: { id }, relations: ['industry'] });
  res.json(presentCompany(reloaded!));
};

export const deleteCompany = async (req: Request, res: Response): Promise<void> => {
  const id = Number(req.params.companyId);
  const company = await repos.company().findOne({ where: { id } });
  if (!company) throw HttpError.notFound('Компания не найдена');
  await assertCompanyAccess(req.user!.id, id);
  await repos.company().delete({ id });
  res.status(204).send();
};
