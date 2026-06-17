import { Request, Response, NextFunction } from 'express';
import { ProfileService } from '../services/profile.service';
import { UpdateSeekerProfileDto } from '../dto/UpdateSeekerProfileDto';
import { UpdateEmployerProfileDto } from '../dto/UpdateEmployerProfileDto';

const service = new ProfileService();

export const updateSeeker = async (
  req: Request<object, object, UpdateSeekerProfileDto>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await service.updateSeeker(req.user!.sub, req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const updateEmployer = async (
  req: Request<object, object, UpdateEmployerProfileDto>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await service.updateEmployer(req.user!.sub, req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
};
