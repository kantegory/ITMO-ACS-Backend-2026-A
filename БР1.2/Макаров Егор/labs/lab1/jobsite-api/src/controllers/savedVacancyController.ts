import { Request, Response } from 'express';
import { repos } from '../repos';
import { HttpError } from '../utils/httpError';
import { currentSeeker } from './seekerController';
import { getPageParams, buildMeta } from '../utils/pagination';
import { presentVacancy } from '../presenters';

export const listSaved = async (req: Request, res: Response): Promise<void> => {
  const seeker = await currentSeeker(req.user!.id);
  const { page, limit, skip, take } = getPageParams(req.query);
  const [items, total] = await repos.savedVacancy().findAndCount({
    where: { jobSeekerId: seeker.id },
    relations: ['vacancy'],
    skip, take,
    order: { createdAt: 'DESC' },
  });
  res.json({ data: items.map((s) => presentVacancy(s.vacancy)), meta: buildMeta(page, limit, total) });
};

export const addSaved = async (req: Request, res: Response): Promise<void> => {
  const seeker = await currentSeeker(req.user!.id);
  const vacancyId = Number(req.body.vacancy_id);

  const vacancy = await repos.vacancy().findOne({ where: { id: vacancyId } });
  if (!vacancy) throw HttpError.notFound('Вакансия не найдена');

  const dup = await repos.savedVacancy().findOne({ where: { jobSeekerId: seeker.id, vacancyId } });
  if (dup) throw HttpError.conflict('Вакансия уже в избранном');

  const saved = repos.savedVacancy().create({ jobSeekerId: seeker.id, vacancyId });
  await repos.savedVacancy().save(saved);
  res.status(201).json({ job_seeker_id: seeker.id, vacancy_id: vacancyId });
};

export const removeSaved = async (req: Request, res: Response): Promise<void> => {
  const seeker = await currentSeeker(req.user!.id);
  const vacancyId = Number(req.params.vacancyId);
  const saved = await repos.savedVacancy().findOne({ where: { jobSeekerId: seeker.id, vacancyId } });
  if (!saved) throw HttpError.notFound('Вакансия не найдена в избранном');
  await repos.savedVacancy().delete({ jobSeekerId: seeker.id, vacancyId });
  res.status(204).send();
};
