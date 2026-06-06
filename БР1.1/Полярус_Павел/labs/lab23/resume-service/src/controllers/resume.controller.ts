import { Request, Response, NextFunction } from 'express';
import { ResumeService } from '../services/resume.service';

const service = new ResumeService();

export async function getMyResumes(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await service.findMy(req.user!.sub));
  } catch (err) {
    next(err);
  }
}

export async function createResume(req: Request, res: Response, next: NextFunction) {
  try {
    res.status(201).json(await service.create(req.user!.sub, req.body));
  } catch (err) {
    next(err);
  }
}

export async function getResume(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await service.findOne(req.params.resumeId, req.user!.sub, req.user!.role));
  } catch (err) {
    next(err);
  }
}

export async function updateResume(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await service.update(req.params.resumeId, req.user!.sub, req.body));
  } catch (err) {
    next(err);
  }
}

export async function deleteResume(req: Request, res: Response, next: NextFunction) {
  try {
    await service.remove(req.params.resumeId, req.user!.sub);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function addSkill(req: Request, res: Response, next: NextFunction) {
  try {
    res.status(201).json(await service.addSkill(req.params.resumeId, req.user!.sub, req.body));
  } catch (err) {
    next(err);
  }
}

export async function removeSkill(req: Request, res: Response, next: NextFunction) {
  try {
    await service.removeSkill(req.params.resumeId, req.params.skillId, req.user!.sub);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function addWorkExperience(req: Request, res: Response, next: NextFunction) {
  try {
    res.status(201).json(await service.addWorkExperience(req.params.resumeId, req.user!.sub, req.body));
  } catch (err) {
    next(err);
  }
}

export async function updateWorkExperience(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await service.updateWorkExperience(req.params.resumeId, req.params.workId, req.user!.sub, req.body));
  } catch (err) {
    next(err);
  }
}

export async function deleteWorkExperience(req: Request, res: Response, next: NextFunction) {
  try {
    await service.removeWorkExperience(req.params.resumeId, req.params.workId, req.user!.sub);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function addEducation(req: Request, res: Response, next: NextFunction) {
  try {
    res.status(201).json(await service.addEducation(req.params.resumeId, req.user!.sub, req.body));
  } catch (err) {
    next(err);
  }
}

export async function updateEducation(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await service.updateEducation(req.params.resumeId, req.params.educationId, req.user!.sub, req.body));
  } catch (err) {
    next(err);
  }
}

export async function deleteEducation(req: Request, res: Response, next: NextFunction) {
  try {
    await service.removeEducation(req.params.resumeId, req.params.educationId, req.user!.sub);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
