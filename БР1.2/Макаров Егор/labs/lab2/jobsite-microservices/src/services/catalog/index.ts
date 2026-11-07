import 'reflect-metadata';
import { DataSource, In, ILike } from 'typeorm';
import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { env } from '../../common/env';
import { createServiceApp } from '../../common/createApp';
import { asyncHandler, authenticate, validate, internalOnly, getPageParams, buildMeta } from '../../common/http';
import { HttpError } from '../../common/httpError';
import { Skill } from './entities/Skill';
import { Industry } from './entities/Industry';

export const dataSource = new DataSource({
  type: 'postgres',
  host: env.db.host, port: env.db.port, username: env.db.user, password: env.db.password,
  database: env.db.name, synchronize: true, logging: false, entities: [Skill, Industry],
});

const skills = () => dataSource.getRepository(Skill);
const industries = () => dataSource.getRepository(Industry);

const routes = Router();

routes.get('/industries', asyncHandler(async (_req: Request, res: Response) => {
  res.json(await industries().find({ order: { name: 'ASC' } }));
}));

routes.get('/skills', asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip, take } = getPageParams(req.query);
  const where = req.query.search ? { name: ILike(`%${req.query.search}%`) } : {};
  const [items, total] = await skills().findAndCount({ where, skip, take, order: { name: 'ASC' } });
  res.json({ data: items, meta: buildMeta(page, limit, total) });
}));

routes.post('/skills', authenticate, validate(z.object({ name: z.string().min(1).max(100) })),
  asyncHandler(async (req: Request, res: Response) => {
    const name = req.body.name.trim();
    if (await skills().findOne({ where: { name } })) throw HttpError.conflict('Навык уже существует');
    const skill = skills().create({ name });
    await skills().save(skill);
    res.status(201).json(skill);
  }));

// ---------- internal ----------
const internal = Router();
internal.use(internalOnly);

internal.get('/skills', asyncHandler(async (req: Request, res: Response) => {
  const raw = req.query.ids;
  const ids = (Array.isArray(raw) ? raw : raw ? [raw] : []).map(Number).filter(Boolean);
  if (ids.length === 0) { res.json([]); return; }
  res.json(await skills().findBy({ id: In(ids) }));
}));

internal.get('/skills/:id/exists', asyncHandler(async (req: Request, res: Response) => {
  const found = await skills().findOne({ where: { id: Number(req.params.id) } });
  res.json({ exists: !!found });
}));

internal.get('/industries/:id', asyncHandler(async (req: Request, res: Response) => {
  const ind = await industries().findOne({ where: { id: Number(req.params.id) } });
  if (!ind) throw HttpError.notFound();
  res.json(ind);
}));

export const app = createServiceApp('catalog', routes, internal);

// наполнение справочников при старте
export const seed = async (): Promise<void> => {
  const INDUSTRIES = ['Информационные технологии', 'Финансы и банки', 'Маркетинг и реклама', 'Образование', 'Розничная торговля', 'Производство'];
  const SKILLS = ['JavaScript', 'TypeScript', 'Node.js', 'Express', 'PostgreSQL', 'TypeORM', 'React', 'Vue', 'Docker', 'Git', 'REST API', 'Python', 'SQL', 'Linux'];
  for (const name of INDUSTRIES) {
    if (!(await industries().findOne({ where: { name } }))) await industries().save(industries().create({ name }));
  }
  for (const name of SKILLS) {
    if (!(await skills().findOne({ where: { name } }))) await skills().save(skills().create({ name }));
  }
};
