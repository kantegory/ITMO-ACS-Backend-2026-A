import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../config/database';
import { Vacancy } from '../entities/Vacancy';
import { AppError } from '../utils/errors';

export async function getVacancyById(req: Request, res: Response, next: NextFunction) {
  try {
    const vacancyRepo = AppDataSource.getRepository(Vacancy);
    const vacancy = await vacancyRepo.findOne({ where: { id: req.params.vacancyId } });
    if (!vacancy) throw new AppError(404, 'Vacancy not found');
    res.json({
      id: vacancy.id,
      title: vacancy.title,
      employerId: vacancy.employer_id,
      companyId: vacancy.company_id,
      isPublished: vacancy.is_published,
    });
  } catch (err) {
    next(err);
  }
}
