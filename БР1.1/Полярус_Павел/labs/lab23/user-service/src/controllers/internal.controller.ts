import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../config/database';
import { JobSeeker } from '../entities/JobSeeker';
import { Employer } from '../entities/Employer';
import { AppError } from '../utils/errors';

export async function getSeekerByUser(req: Request, res: Response, next: NextFunction) {
  try {
    const seekerRepo = AppDataSource.getRepository(JobSeeker);
    const seeker = await seekerRepo.findOne({ where: { user_id: req.params.userId } });
    if (!seeker) throw new AppError(404, 'Seeker not found');
    res.json({
      id: seeker.id,
      userId: seeker.user_id,
      cityId: seeker.city_id,
      firstName: seeker.first_name,
      lastName: seeker.last_name,
    });
  } catch (err) {
    next(err);
  }
}

export async function getEmployerByUser(req: Request, res: Response, next: NextFunction) {
  try {
    const employerRepo = AppDataSource.getRepository(Employer);
    const employer = await employerRepo.findOne({ where: { user_id: req.params.userId } });
    if (!employer) throw new AppError(404, 'Employer not found');
    res.json({
      id: employer.id,
      userId: employer.user_id,
      companyId: employer.company_id,
      firstName: employer.first_name,
      lastName: employer.last_name,
      position: employer.position,
    });
  } catch (err) {
    next(err);
  }
}
