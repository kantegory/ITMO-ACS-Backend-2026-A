import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../config/database';
import { Resume } from '../entities/Resume';
import { AppError } from '../utils/errors';

export async function getResumeById(req: Request, res: Response, next: NextFunction) {
  try {
    const repo = AppDataSource.getRepository(Resume);
    const resume = await repo.findOne({ where: { id: req.params.resumeId } });
    if (!resume) throw new AppError(404, 'Resume not found');
    res.json({
      id: resume.id,
      title: resume.title,
      jobSeekerId: resume.job_seeker_id,
      isPublished: resume.is_published,
      experienceMonths: resume.experience_months_cached,
      updatedAt: resume.updated_at,
    });
  } catch (err) {
    next(err);
  }
}
