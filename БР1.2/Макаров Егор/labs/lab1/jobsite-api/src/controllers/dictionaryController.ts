import { Request, Response } from 'express';
import { ILike } from 'typeorm';
import { repos } from '../repos';
import { HttpError } from '../utils/httpError';
import { getPageParams, buildMeta } from '../utils/pagination';
import { presentSkill, presentIndustry } from '../presenters';

export const listIndustries = async (_req: Request, res: Response): Promise<void> => {
  const items = await repos.industry().find({ order: { name: 'ASC' } });
  res.json(items.map(presentIndustry));
};

export const listSkills = async (req: Request, res: Response): Promise<void> => {
  const { page, limit, skip, take } = getPageParams(req.query);
  const where = req.query.search ? { name: ILike(`%${req.query.search}%`) } : {};
  const [items, total] = await repos.skill().findAndCount({
    where, skip, take, order: { name: 'ASC' },
  });
  res.json({ data: items.map(presentSkill), meta: buildMeta(page, limit, total) });
};

export const createSkill = async (req: Request, res: Response): Promise<void> => {
  const name = req.body.name.trim();
  const exists = await repos.skill().findOne({ where: { name } });
  if (exists) throw HttpError.conflict('Навык уже существует');
  const skill = repos.skill().create({ name });
  await repos.skill().save(skill);
  res.status(201).json(presentSkill(skill));
};
