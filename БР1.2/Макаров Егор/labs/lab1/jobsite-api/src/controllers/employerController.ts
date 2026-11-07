import { Request, Response } from 'express';
import { repos } from '../repos';
import { HttpError } from '../utils/httpError';
import { presentEmployer } from '../presenters';
import { Employer } from '../entities/Employer';

export const currentEmployer = async (userId: number, withCompany = false): Promise<Employer> => {
  const employer = await repos.employer().findOne({
    where: { userId },
    relations: withCompany ? ['company', 'company.industry'] : [],
  });
  if (!employer) throw HttpError.notFound('Профиль работодателя не найден');
  return employer;
};

export const getProfile = async (req: Request, res: Response): Promise<void> => {
  const employer = await currentEmployer(req.user!.id, true);
  res.json(presentEmployer(employer));
};

export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  const employer = await currentEmployer(req.user!.id);
  const b = req.body;
  if (b.company_id !== undefined) {
    const company = await repos.company().findOne({ where: { id: b.company_id } });
    if (!company) throw HttpError.validation('Компания не найдена', [
      { field: 'company_id', message: 'Компания не найдена' },
    ]);
    employer.companyId = company.id;
  }
  if (b.position !== undefined) employer.position = b.position ?? null;
  await repos.employer().save(employer);
  const reloaded = await currentEmployer(req.user!.id, true);
  res.json(presentEmployer(reloaded));
};
