import { Request, Response } from 'express';
import { In } from 'typeorm';
import { repos } from '../repos';
import { HttpError } from '../utils/httpError';
import { currentSeeker } from './seekerController';
import { currentEmployer } from './employerController';
import { getPageParams, buildMeta } from '../utils/pagination';
import { presentApplication, presentApplicationDetail } from '../presenters';
import { UserRole } from '../entities/enums';

export const createApplication = async (req: Request, res: Response): Promise<void> => {
  const seeker = await currentSeeker(req.user!.id);
  const vacancyId = Number(req.params.vacancyId);
  const { resume_id, cover_letter } = req.body;

  const vacancy = await repos.vacancy().findOne({ where: { id: vacancyId } });
  if (!vacancy) throw HttpError.notFound('Вакансия не найдена');

  const resume = await repos.resume().findOne({ where: { id: resume_id } });
  if (!resume) throw HttpError.notFound('Резюме не найдено');
  if (resume.jobSeekerId !== seeker.id) throw HttpError.forbidden('Это не ваше резюме');

  const dup = await repos.application().findOne({ where: { vacancyId, resumeId: resume_id } });
  if (dup) throw HttpError.conflict('Отклик этим резюме на данную вакансию уже существует');

  const application = repos.application().create({
    vacancyId,
    resumeId: resume_id,
    coverLetter: cover_letter ?? null,
  });
  await repos.application().save(application);
  res.status(201).json(presentApplication(application));
};

export const listVacancyApplications = async (req: Request, res: Response): Promise<void> => {
  const vacancyId = Number(req.params.vacancyId);
  const vacancy = await repos.vacancy().findOne({ where: { id: vacancyId } });
  if (!vacancy) throw HttpError.notFound('Вакансия не найдена');
  const employer = await currentEmployer(req.user!.id);
  if (employer.companyId !== vacancy.companyId) {
    throw HttpError.forbidden('Вакансия принадлежит другой компании');
  }

  const { page, limit, skip, take } = getPageParams(req.query);
  const where: Record<string, unknown> = { vacancyId };
  if (req.query.status) where.status = req.query.status;
  const [items, total] = await repos.application().findAndCount({
    where, skip, take, order: { createdAt: 'DESC' },
  });
  res.json({ data: items.map(presentApplication), meta: buildMeta(page, limit, total) });
};

export const listMyApplications = async (req: Request, res: Response): Promise<void> => {
  const seeker = await currentSeeker(req.user!.id);
  const resumes = await repos.resume().find({ where: { jobSeekerId: seeker.id } });
  const resumeIds = resumes.map((r) => r.id);
  const { page, limit, skip, take } = getPageParams(req.query);
  if (resumeIds.length === 0) {
    res.json({ data: [], meta: buildMeta(page, limit, 0) });
    return;
  }
  const where: Record<string, unknown> = { resumeId: In(resumeIds) };
  if (req.query.status) where.status = req.query.status;
  const [items, total] = await repos.application().findAndCount({
    where, skip, take, order: { createdAt: 'DESC' },
  });
  res.json({ data: items.map(presentApplication), meta: buildMeta(page, limit, total) });
};

// проверяет доступ к отклику: владелец-резюме (соискатель) или работодатель компании-вакансии
const loadAccessibleApplication = async (req: Request) => {
  const application = await repos.application().findOne({
    where: { id: Number(req.params.applicationId) },
    relations: ['vacancy', 'resume'],
  });
  if (!application) throw HttpError.notFound('Отклик не найден');

  if (req.user!.role === UserRole.SEEKER) {
    const seeker = await currentSeeker(req.user!.id);
    if (application.resume.jobSeekerId !== seeker.id) throw HttpError.forbidden();
  } else {
    const employer = await currentEmployer(req.user!.id);
    if (employer.companyId !== application.vacancy.companyId) throw HttpError.forbidden();
  }
  return application;
};

export const getApplication = async (req: Request, res: Response): Promise<void> => {
  const application = await loadAccessibleApplication(req);
  res.json(presentApplicationDetail(application));
};

export const updateApplicationStatus = async (req: Request, res: Response): Promise<void> => {
  const application = await repos.application().findOne({
    where: { id: Number(req.params.applicationId) },
    relations: ['vacancy'],
  });
  if (!application) throw HttpError.notFound('Отклик не найден');
  const employer = await currentEmployer(req.user!.id);
  if (employer.companyId !== application.vacancy.companyId) throw HttpError.forbidden();

  application.status = req.body.status;
  await repos.application().save(application);
  res.json(presentApplication(application));
};

export const deleteApplication = async (req: Request, res: Response): Promise<void> => {
  const seeker = await currentSeeker(req.user!.id);
  const application = await repos.application().findOne({
    where: { id: Number(req.params.applicationId) },
    relations: ['resume'],
  });
  if (!application) throw HttpError.notFound('Отклик не найден');
  if (application.resume.jobSeekerId !== seeker.id) throw HttpError.forbidden();
  await repos.application().delete({ id: application.id });
  res.status(204).send();
};
