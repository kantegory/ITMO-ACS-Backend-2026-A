import { Request, Response, NextFunction } from 'express';
import { VacancyService } from '../services/vacancy.service';

const service = new VacancyService();

export async function getVacancies(req: Request, res: Response, next: NextFunction) {
  try {
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
    res.json(await service.findAll(page, limit));
  } catch (err) {
    next(err);
  }
}

export async function getVacancy(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await service.findOne(req.params.vacancyId));
  } catch (err) {
    next(err);
  }
}

export async function createVacancy(req: Request, res: Response, next: NextFunction) {
  try {
    res.status(201).json(await service.create(req.user!.sub, req.body));
  } catch (err) {
    next(err);
  }
}

export async function updateVacancy(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await service.update(req.params.vacancyId, req.user!.sub, req.body));
  } catch (err) {
    next(err);
  }
}

export async function deleteVacancy(req: Request, res: Response, next: NextFunction) {
  try {
    await service.remove(req.params.vacancyId, req.user!.sub);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function addSkill(req: Request, res: Response, next: NextFunction) {
  try {
    res.status(201).json(await service.addSkill(req.params.vacancyId, req.user!.sub, req.body));
  } catch (err) {
    next(err);
  }
}

export async function removeSkill(req: Request, res: Response, next: NextFunction) {
  try {
    await service.removeSkill(req.params.vacancyId, req.params.skillId, req.user!.sub);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function getEmployerVacancies(req: Request, res: Response, next: NextFunction) {
  try {
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
    res.json(await service.findByEmployer(req.user!.sub, page, limit));
  } catch (err) {
    next(err);
  }
}
