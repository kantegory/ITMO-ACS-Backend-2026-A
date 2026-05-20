import { Response, NextFunction } from "express";
import { AuthRequest } from "../middleware/auth";
import { ProfileService } from "../services/profile.service";
import { toUser, toProfile, toResume } from "../utils/mappers";
import { routeParam } from "../utils/params";

export class ProfileController {
  static async me(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = await ProfileService.me(req.user!.userId);
      res.json(toUser(user));
    } catch (e) {
      next(e);
    }
  }

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
      res.json({ items: items.map(toResume) });
    } catch (e) {
      next(e);
    }
  }

  static async createResume(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const resume = await ProfileService.createResume(req.user!.userId, {
        title: req.body.title,
        summary: req.body.summary,
        experienceLevel: req.body.experience_level,
        skills: req.body.skills,
      });
      res.status(201).json(toResume(resume));
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
          summary: req.body.summary,
          experienceLevel: req.body.experience_level,
          skills: req.body.skills,
        },
      );
      res.json(toResume(resume));
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
}
