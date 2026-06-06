import { Response, NextFunction } from "express";
import { AuthRequest } from "../middleware/auth";
import { ProfileService } from "../services/profile.service";
import { toProfile } from "../utils/mappers";
import { toResumeDetails, toResumeSummary, toSkill } from "../utils/resume.mappers";
import { routeParam } from "../utils/params";
import { badRequest } from "../utils/errors";

export class ProfileController {
  static async upsertProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const profile = await ProfileService.upsertProfile(req.user!.userId, req.body);
      res.json(toProfile(profile));
    } catch (e) {
      next(e);
    }
  }

  static async listResumes(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const items = await ProfileService.listResumes(req.user!.userId);
      res.json({ items: items.map(toResumeDetails) });
    } catch (e) {
      next(e);
    }
  }

  static async getResume(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const resume = await ProfileService.getResume(
        req.user!.userId,
        routeParam(req.params.id),
      );
      res.json(toResumeDetails(resume));
    } catch (e) {
      next(e);
    }
  }

  static async createResume(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const resume = await ProfileService.createResume(req.user!.userId, {
        title: req.body.title,
        experienceLevel: req.body.experience_level,
      });
      res.status(201).json(toResumeDetails(resume));
    } catch (e) {
      next(e);
    }
  }

  static async updateResume(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const resume = await ProfileService.updateResume(
        req.user!.userId,
        routeParam(req.params.id),
        {
          title: req.body.title,
          experienceLevel: req.body.experience_level,
        },
      );
      res.json(toResumeDetails(resume));
    } catch (e) {
      next(e);
    }
  }

  static async deleteResume(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await ProfileService.deleteResume(req.user!.userId, routeParam(req.params.id));
      res.status(204).send();
    } catch (e) {
      next(e);
    }
  }

  static async upsertSummary(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.body.content?.trim()) throw badRequest();
      const summary = await ProfileService.upsertSummary(
        req.user!.userId,
        routeParam(req.params.id),
        req.body.content,
      );
      res.json(toResumeSummary(summary));
    } catch (e) {
      next(e);
    }
  }

  static async deleteSummary(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await ProfileService.deleteSummary(req.user!.userId, routeParam(req.params.id));
      res.status(204).send();
    } catch (e) {
      next(e);
    }
  }

  static async listSkills(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const skills = await ProfileService.listSkills(
        req.user!.userId,
        routeParam(req.params.id),
      );
      res.json({ items: skills.map(toSkill) });
    } catch (e) {
      next(e);
    }
  }

  static async setSkills(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const skills = await ProfileService.setSkills(
        req.user!.userId,
        routeParam(req.params.id),
        req.body.skills ?? [],
      );
      res.json({ items: skills.map(toSkill) });
    } catch (e) {
      next(e);
    }
  }
}
