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
import { UserRole, CompanySize } from '../../common/enums';
import { callService } from '../../common/internalClient';
import { Employer } from './entities/Employer';
import { Company } from './entities/Company';

export const dataSource = new DataSource({
  type: 'postgres',
  host: env.db.host, port: env.db.port, username: env.db.user, password: env.db.password,
  database: env.db.name, synchronize: true, logging: false, entities: [Employer, Company],
});

const employers = () => dataSource.getRepository(Employer);
const companies = () => dataSource.getRepository(Company);
const employerOnly = requireRole(UserRole.EMPLOYER);
const enums = <T extends Record<string, string>>(e: T) => Object.values(e) as [string, ...string[]];

// отрасль берём из Catalog Service
const fetchIndustry = async (id?: number | null) => {
  if (!id) return null;
  return callService<{ id: number; name: string }>('catalog', `/internal/industries/${id}`, { nullOn404: true });
};

const presentCompany = async (c: Company) => ({
  id: c.id, name: c.name, description: c.description ?? null, logo_url: c.logoUrl ?? null,
  website: c.website ?? null, industry: await fetchIndustry(c.industryId), size: c.size ?? null,
  city: c.city ?? null, created_at: c.createdAt,
});
const presentEmployer = async (e: Employer) => {
  const company = e.companyId ? await companies().findOne({ where: { id: e.companyId } }) : null;
  return {
    id: e.id, user_id: e.userId, company: company ? await presentCompany(company) : null,
    position: e.position ?? null, created_at: e.createdAt,
  };
};

const currentEmployer = async (userId: number): Promise<Employer> => {
  const e = await employers().findOne({ where: { userId } });
  if (!e) throw HttpError.notFound('Профиль работодателя не найден');
  return e;
};

const companySchema = z.object({
  name: z.string().min(1).max(255), description: z.string().nullish(), logo_url: z.string().url().nullish(),
  website: z.string().max(255).nullish(), industry_id: z.number().int().positive().nullish(),
  size: z.enum(enums(CompanySize)).nullish(), city: z.string().max(100).nullish(),
});
const employerSchema = z.object({
  company_id: z.number().int().positive().optional(), position: z.string().max(255).nullish(),
});

const routes = Router();

// ---------- employer profile ----------
routes.get('/employer/profile', authenticate, employerOnly, asyncHandler(async (req: Request, res: Response) => {
  res.json(await presentEmployer(await currentEmployer(req.user!.id)));
}));
routes.put('/employer/profile', authenticate, employerOnly, validate(employerSchema), asyncHandler(async (req: Request, res: Response) => {
  const e = await currentEmployer(req.user!.id);
  const b = req.body;
  if (b.company_id !== undefined) {
    if (!(await companies().findOne({ where: { id: b.company_id } }))) {
      throw HttpError.validation('Компания не найдена', [{ field: 'company_id', message: 'Компания не найдена' }]);
    }
    e.companyId = b.company_id;
  }
  if (b.position !== undefined) e.position = b.position ?? null;
  await employers().save(e);
  res.json(await presentEmployer(e));
}));

// ---------- companies ----------
routes.get('/companies', asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip, take } = getPageParams(req.query);
  const qb = companies().createQueryBuilder('c');
  if (req.query.industry_id) qb.andWhere('c.industry_id = :i', { i: Number(req.query.industry_id) });
  if (req.query.city) qb.andWhere('c.city ILIKE :city', { city: `%${req.query.city}%` });
  if (req.query.size) qb.andWhere('c.size = :s', { s: req.query.size });
  qb.orderBy('c.created_at', 'DESC').offset(skip).limit(take);
  const [items, total] = await qb.getManyAndCount();
  res.json({ data: await Promise.all(items.map(presentCompany)), meta: buildMeta(page, limit, total) });
}));

routes.post('/companies', authenticate, employerOnly, validate(companySchema), asyncHandler(async (req: Request, res: Response) => {
  const employer = await currentEmployer(req.user!.id);
  const b = req.body;
  const company = companies().create({
    name: b.name, description: b.description ?? null, logoUrl: b.logo_url ?? null,
    website: b.website ?? null, industryId: b.industry_id ?? null, size: b.size ?? null, city: b.city ?? null,
  });
  await companies().save(company);
  if (!employer.companyId) { employer.companyId = company.id; await employers().save(employer); }
  res.status(201).json(await presentCompany(company));
}));

routes.get('/companies/:companyId', asyncHandler(async (req: Request, res: Response) => {
  const c = await companies().findOne({ where: { id: Number(req.params.companyId) } });
  if (!c) throw HttpError.notFound('Компания не найдена');
  res.json(await presentCompany(c));
}));

const assertCompanyAccess = async (userId: number, companyId: number) => {
  const e = await currentEmployer(userId);
  if (e.companyId !== companyId) throw HttpError.forbidden('Вы не относитесь к этой компании');
};

routes.put('/companies/:companyId', authenticate, employerOnly, validate(companySchema), asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.companyId);
  const c = await companies().findOne({ where: { id } });
  if (!c) throw HttpError.notFound('Компания не найдена');
  await assertCompanyAccess(req.user!.id, id);
  const b = req.body;
  Object.assign(c, {
    name: b.name, description: b.description ?? null, logoUrl: b.logo_url ?? null, website: b.website ?? null,
    industryId: b.industry_id ?? null, size: b.size ?? null, city: b.city ?? null,
  });
  await companies().save(c);
  res.json(await presentCompany(c));
}));

routes.delete('/companies/:companyId', authenticate, employerOnly, asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.companyId);
  const c = await companies().findOne({ where: { id } });
  if (!c) throw HttpError.notFound('Компания не найдена');
  await assertCompanyAccess(req.user!.id, id);
  await companies().delete({ id });
  res.status(204).send();
}));

// ---------- internal ----------
const internal = Router();
internal.use(internalOnly);

internal.post('/employers', asyncHandler(async (req: Request, res: Response) => {
  const employer = employers().create({ userId: req.body.user_id });
  await employers().save(employer);
  res.status(201).json({ id: employer.id, user_id: employer.userId });
}));

internal.get('/employers/by-user/:userId', asyncHandler(async (req: Request, res: Response) => {
  const e = await employers().findOne({ where: { userId: Number(req.params.userId) } });
  if (!e) throw HttpError.notFound();
  res.json({ employer_id: e.id, company_id: e.companyId ?? null });
}));

internal.get('/employers/:id/company', asyncHandler(async (req: Request, res: Response) => {
  const e = await employers().findOne({ where: { id: Number(req.params.id) } });
  if (!e) throw HttpError.notFound();
  res.json({ employer_id: e.id, company_id: e.companyId ?? null });
}));

internal.get('/companies/:id', asyncHandler(async (req: Request, res: Response) => {
  const c = await companies().findOne({ where: { id: Number(req.params.id) } });
  if (!c) throw HttpError.notFound();
  res.json({ id: c.id, name: c.name, industry_id: c.industryId ?? null });
}));

export const app = createServiceApp('employer', routes, internal);
