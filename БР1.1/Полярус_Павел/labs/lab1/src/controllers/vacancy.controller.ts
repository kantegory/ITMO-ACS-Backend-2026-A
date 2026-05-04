import { Request, Response, NextFunction } from 'express';
import { VacancyService } from '../services/vacancy.service';

const service = new VacancyService();

const h =
  (fn: (req: Request, res: Response) => Promise<unknown>) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await fn(req, res);
    } catch (err) {
      next(err);
    }
  };

export const getVacancies = h(async (req, res) => {
  const page = req.query.page ? parseInt(req.query.page as string) : 1;
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
  res.json(await service.findAll(page, limit));
});

export const createVacancy = h(async (req, res) => {
  res.status(201).json(await service.create(req.user!.sub, req.body));
});

export const getVacancy = h(async (req, res) => {
  res.json(await service.findOne(req.params.vacancyId));
});

export const updateVacancy = h(async (req, res) => {
  res.json(await service.update(req.params.vacancyId, req.user!.sub, req.body));
});

export const deleteVacancy = h(async (req, res) => {
  await service.remove(req.params.vacancyId, req.user!.sub);
  res.status(204).send();
});

export const addSkill = h(async (req, res) => {
  res.status(201).json(await service.addSkill(req.params.vacancyId, req.user!.sub, req.body));
});

export const removeSkill = h(async (req, res) => {
  await service.removeSkill(req.params.vacancyId, req.params.skillId, req.user!.sub);
  res.status(204).send();
});

export const getApplications = h(async (req, res) => {
  res.json(await service.getApplications(req.params.vacancyId, req.user!.sub));
});

export const getEmployerVacancies = h(async (req, res) => {
  const page = req.query.page ? parseInt(req.query.page as string) : 1;
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
  res.json(await service.findByEmployer(req.user!.sub, page, limit));
});
