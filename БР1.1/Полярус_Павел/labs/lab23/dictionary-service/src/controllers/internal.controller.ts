import { Request, Response, NextFunction } from 'express';
import { DictionaryService } from '../services/dictionary.service';

const service = new DictionaryService();

export async function getCityById(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await service.getCityById(req.params.id));
  } catch (err) {
    next(err);
  }
}

export async function getIndustryById(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await service.getIndustryById(req.params.id));
  } catch (err) {
    next(err);
  }
}

export async function getSkillById(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await service.getSkillById(req.params.id));
  } catch (err) {
    next(err);
  }
}

export async function getEmploymentTypeById(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await service.getEmploymentTypeById(req.params.id));
  } catch (err) {
    next(err);
  }
}

export async function getDegreeTypeById(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await service.getDegreeTypeById(req.params.id));
  } catch (err) {
    next(err);
  }
}
