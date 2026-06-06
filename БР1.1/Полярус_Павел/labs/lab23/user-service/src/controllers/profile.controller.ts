import { Request, Response, NextFunction } from 'express';
import { ProfileService } from '../services/profile.service';

const service = new ProfileService();

export const updateSeeker = async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(await service.updateSeeker(req.user!.sub, req.body));
  } catch (err) {
    next(err);
  }
};

export const updateEmployer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(await service.updateEmployer(req.user!.sub, req.body));
  } catch (err) {
    next(err);
  }
};
