import { Request, Response, NextFunction } from 'express';
import { DictionaryService } from '../services/dictionary.service';

const service = new DictionaryService();

export async function getCountries(_req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await service.getCountries());
  } catch (err) {
    next(err);
  }
}

export async function getCities(_req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await service.getCities());
  } catch (err) {
    next(err);
  }
}

export async function getIndustries(_req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await service.getIndustries());
  } catch (err) {
    next(err);
  }
}

export async function getSkills(_req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await service.getSkills());
  } catch (err) {
    next(err);
  }
}

export async function getEmploymentTypes(_req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await service.getEmploymentTypes());
  } catch (err) {
    next(err);
  }
}

export async function getDegreeTypes(_req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await service.getDegreeTypes());
  } catch (err) {
    next(err);
  }
}
