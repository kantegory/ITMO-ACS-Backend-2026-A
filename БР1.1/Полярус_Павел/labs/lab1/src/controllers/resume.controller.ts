import { Request, Response, NextFunction } from 'express';
import { ResumeService } from '../services/resume.service';

const service = new ResumeService();

const h =
  (fn: (req: Request, res: Response) => Promise<unknown>) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await fn(req, res);
    } catch (err) {
      next(err);
    }
  };

export const getMyResumes = h(async (req, res) => {
  res.json(await service.findMy(req.user!.sub));
});

export const createResume = h(async (req, res) => {
  res.status(201).json(await service.create(req.user!.sub, req.body));
});

export const getResume = h(async (req, res) => {
  res.json(await service.findOne(req.params.resumeId, req.user!.sub, req.user!.role));
});

export const updateResume = h(async (req, res) => {
  res.json(await service.update(req.params.resumeId, req.user!.sub, req.body));
});

export const deleteResume = h(async (req, res) => {
  await service.remove(req.params.resumeId, req.user!.sub);
  res.status(204).send();
});

export const addSkill = h(async (req, res) => {
  res.status(201).json(await service.addSkill(req.params.resumeId, req.user!.sub, req.body));
});

export const removeSkill = h(async (req, res) => {
  await service.removeSkill(req.params.resumeId, req.params.skillId, req.user!.sub);
  res.status(204).send();
});

export const addWorkExperience = h(async (req, res) => {
  res.status(201).json(
    await service.addWorkExperience(req.params.resumeId, req.user!.sub, req.body),
  );
});

export const updateWorkExperience = h(async (req, res) => {
  res.json(
    await service.updateWorkExperience(
      req.params.resumeId,
      req.params.workId,
      req.user!.sub,
      req.body,
    ),
  );
});

export const deleteWorkExperience = h(async (req, res) => {
  await service.removeWorkExperience(req.params.resumeId, req.params.workId, req.user!.sub);
  res.status(204).send();
});

export const addEducation = h(async (req, res) => {
  res.status(201).json(
    await service.addEducation(req.params.resumeId, req.user!.sub, req.body),
  );
});

export const updateEducation = h(async (req, res) => {
  res.json(
    await service.updateEducation(
      req.params.resumeId,
      req.params.educationId,
      req.user!.sub,
      req.body,
    ),
  );
});

export const deleteEducation = h(async (req, res) => {
  await service.removeEducation(req.params.resumeId, req.params.educationId, req.user!.sub);
  res.status(204).send();
});
