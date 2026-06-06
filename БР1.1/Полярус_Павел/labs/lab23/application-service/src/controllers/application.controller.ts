import { Request, Response, NextFunction } from 'express';
import * as service from '../services/application.service';
import { AppError } from '../utils/errors';

export async function createApplication(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await service.createApplication(req.user!.sub, req.body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function getMyApplications(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await service.getMyApplications(req.user!.sub);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getApplicationById(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await service.getApplicationById(req.user!.sub, req.user!.role, req.params.id);
    if (!result) throw new AppError(404, 'Application not found');
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function updateApplicationStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await service.updateApplicationStatus(req.user!.sub, req.params.id, req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
}
