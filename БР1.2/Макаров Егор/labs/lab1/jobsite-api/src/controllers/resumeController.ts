import { Request, Response } from 'express';
import { In } from 'typeorm';
import { repos } from '../repos';
import { HttpError } from '../utils/httpError';
import { currentSeeker } from './seekerController';
import { getPageParams, buildMeta } from '../utils/pagination';
import {
  presentResume, presentResumeDetail, presentSkill,
  presentWorkExperience, presentEducation,
} from '../presenters';
import { Resume } from '../entities/Resume';

const loadSkills = async (ids?: number[]) => {
  if (!ids || ids.length === 0) return [];
  const skills = await repos.skill().findBy({ id: In(ids) });
  if (skills.length !== new Set(ids).size) {
    throw HttpError.validation('Некоторые навыки не найдены', [
      { field: 'skill_ids', message: 'Передан несуществующий skill_id' },
    ]);
  }
  return skills;
};

// проверяет, что резюме принадлежит текущему соискателю
const ownedResume = async (userId: number, resumeId: number, relations: string[] = []): Promise<Resume> => {
  const resume = await repos.resume().findOne({ where: { id: resumeId }, relations });
  if (!resume) throw HttpError.notFound('Резюме не найдено');
  const seeker = await currentSeeker(userId);
  if (resume.jobSeekerId !== seeker.id) throw HttpError.forbidden('Это не ваше резюме');
  return resume;
};

export const listResumes = async (req: Request, res: Response): Promise<void> => {
  const seeker = await currentSeeker(req.user!.id);
  const { page, limit, skip, take } = getPageParams(req.query);
  const where: Record<string, unknown> = { jobSeekerId: seeker.id };
  if (req.query.status) where.status = req.query.status;
  const [items, total] = await repos.resume().findAndCount({
    where, skip, take, order: { createdAt: 'DESC' },
  });
  res.json({ data: items.map(presentResume), meta: buildMeta(page, limit, total) });
};

export const createResume = async (req: Request, res: Response): Promise<void> => {
  const seeker = await currentSeeker(req.user!.id);
  const b = req.body;
  const resume = repos.resume().create({
    jobSeekerId: seeker.id,
    title: b.title,
    salaryExpected: b.salary_expected ?? null,
    currency: b.currency ?? 'RUB',
    employmentType: b.employment_type ?? null,
    schedule: b.schedule ?? null,
    status: b.status ?? undefined,
    skills: await loadSkills(b.skill_ids),
  });
  await repos.resume().save(resume);
  res.status(201).json(presentResume(resume));
};

export const getResume = async (req: Request, res: Response): Promise<void> => {
  const resume = await repos.resume().findOne({
    where: { id: Number(req.params.resumeId) },
    relations: ['skills', 'workExperiences', 'educations'],
  });
  if (!resume) throw HttpError.notFound('Резюме не найдено');
  res.json(presentResumeDetail(resume));
};

export const updateResume = async (req: Request, res: Response): Promise<void> => {
  const resume = await ownedResume(req.user!.id, Number(req.params.resumeId));
  const b = req.body;
  resume.title = b.title;
  resume.salaryExpected = b.salary_expected ?? null;
  if (b.currency) resume.currency = b.currency;
  resume.employmentType = b.employment_type ?? null;
  resume.schedule = b.schedule ?? null;
  if (b.status) resume.status = b.status;
  if (b.skill_ids) resume.skills = await loadSkills(b.skill_ids);
  await repos.resume().save(resume);
  res.json(presentResume(resume));
};

export const deleteResume = async (req: Request, res: Response): Promise<void> => {
  await ownedResume(req.user!.id, Number(req.params.resumeId));
  await repos.resume().delete({ id: Number(req.params.resumeId) });
  res.status(204).send();
};

export const setResumeSkills = async (req: Request, res: Response): Promise<void> => {
  const resume = await ownedResume(req.user!.id, Number(req.params.resumeId), ['skills']);
  resume.skills = await loadSkills(req.body.skill_ids);
  await repos.resume().save(resume);
  res.json((resume.skills ?? []).map(presentSkill));
};

// ---- work experiences ----
export const listWorkExperiences = async (req: Request, res: Response): Promise<void> => {
  const resumeId = Number(req.params.resumeId);
  const exists = await repos.resume().findOne({ where: { id: resumeId } });
  if (!exists) throw HttpError.notFound('Резюме не найдено');
  const items = await repos.workExperience().find({ where: { resumeId }, order: { startDate: 'DESC' } });
  res.json(items.map(presentWorkExperience));
};

export const createWorkExperience = async (req: Request, res: Response): Promise<void> => {
  const resume = await ownedResume(req.user!.id, Number(req.params.resumeId));
  const b = req.body;
  const we = repos.workExperience().create({
    resumeId: resume.id,
    companyName: b.company_name,
    position: b.position,
    startDate: b.start_date,
    endDate: b.end_date ?? null,
    isCurrent: b.is_current ?? false,
    description: b.description ?? null,
  });
  await repos.workExperience().save(we);
  res.status(201).json(presentWorkExperience(we));
};

const ownedWorkExperience = async (userId: number, id: number) => {
  const we = await repos.workExperience().findOne({ where: { id } });
  if (!we) throw HttpError.notFound('Запись об опыте не найдена');
  await ownedResume(userId, we.resumeId);
  return we;
};

export const updateWorkExperience = async (req: Request, res: Response): Promise<void> => {
  const we = await ownedWorkExperience(req.user!.id, Number(req.params.id));
  const b = req.body;
  we.companyName = b.company_name;
  we.position = b.position;
  we.startDate = b.start_date;
  we.endDate = b.end_date ?? null;
  we.isCurrent = b.is_current ?? false;
  we.description = b.description ?? null;
  await repos.workExperience().save(we);
  res.json(presentWorkExperience(we));
};

export const deleteWorkExperience = async (req: Request, res: Response): Promise<void> => {
  await ownedWorkExperience(req.user!.id, Number(req.params.id));
  await repos.workExperience().delete({ id: Number(req.params.id) });
  res.status(204).send();
};

// ---- educations ----
export const listEducations = async (req: Request, res: Response): Promise<void> => {
  const resumeId = Number(req.params.resumeId);
  const exists = await repos.resume().findOne({ where: { id: resumeId } });
  if (!exists) throw HttpError.notFound('Резюме не найдено');
  const items = await repos.education().find({ where: { resumeId }, order: { startYear: 'DESC' } });
  res.json(items.map(presentEducation));
};

export const createEducation = async (req: Request, res: Response): Promise<void> => {
  const resume = await ownedResume(req.user!.id, Number(req.params.resumeId));
  const b = req.body;
  const ed = repos.education().create({
    resumeId: resume.id,
    institution: b.institution,
    degree: b.degree ?? null,
    fieldOfStudy: b.field_of_study ?? null,
    startYear: b.start_year,
    endYear: b.end_year ?? null,
  });
  await repos.education().save(ed);
  res.status(201).json(presentEducation(ed));
};

const ownedEducation = async (userId: number, id: number) => {
  const ed = await repos.education().findOne({ where: { id } });
  if (!ed) throw HttpError.notFound('Запись об образовании не найдена');
  await ownedResume(userId, ed.resumeId);
  return ed;
};

export const updateEducation = async (req: Request, res: Response): Promise<void> => {
  const ed = await ownedEducation(req.user!.id, Number(req.params.id));
  const b = req.body;
  ed.institution = b.institution;
  ed.degree = b.degree ?? null;
  ed.fieldOfStudy = b.field_of_study ?? null;
  ed.startYear = b.start_year;
  ed.endYear = b.end_year ?? null;
  await repos.education().save(ed);
  res.json(presentEducation(ed));
};

export const deleteEducation = async (req: Request, res: Response): Promise<void> => {
  await ownedEducation(req.user!.id, Number(req.params.id));
  await repos.education().delete({ id: Number(req.params.id) });
  res.status(204).send();
};
