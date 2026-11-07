import { Request, Response } from 'express';
import { repos } from '../repos';
import { HttpError } from '../utils/httpError';
import { presentJobSeeker } from '../presenters';
import { JobSeeker } from '../entities/JobSeeker';

export const currentSeeker = async (userId: number): Promise<JobSeeker> => {
  const seeker = await repos.jobSeeker().findOne({ where: { userId } });
  if (!seeker) throw HttpError.notFound('Профиль соискателя не найден');
  return seeker;
};

export const getProfile = async (req: Request, res: Response): Promise<void> => {
  const seeker = await currentSeeker(req.user!.id);
  res.json(presentJobSeeker(seeker));
};

export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  const seeker = await currentSeeker(req.user!.id);
  const b = req.body;
  seeker.firstName = b.first_name;
  seeker.lastName = b.last_name;
  seeker.phone = b.phone ?? null;
  seeker.city = b.city ?? null;
  seeker.avatarUrl = b.avatar_url ?? null;
  seeker.about = b.about ?? null;
  await repos.jobSeeker().save(seeker);
  res.json(presentJobSeeker(seeker));
};

export const getPublic = async (req: Request, res: Response): Promise<void> => {
  const seeker = await repos.jobSeeker().findOne({ where: { id: Number(req.params.seekerId) } });
  if (!seeker) throw HttpError.notFound('Соискатель не найден');
  res.json(presentJobSeeker(seeker));
};
