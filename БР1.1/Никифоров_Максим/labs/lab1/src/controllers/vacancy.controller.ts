import { Request, Response, NextFunction } from "express";
import { AuthRequest } from "../middleware/auth";
import { VacancyService } from "../services/vacancy.service";
import { toVacancy, toCompany } from "../utils/mappers";
import { routeParam } from "../utils/params";

export class VacancyController {
  static async listPublic(req: Request, res: Response, next: NextFunction) {
    try {
      const items = await VacancyService.listPublished({
        industry: req.query.industry as string,
        salaryFrom: req.query.salary_from
          ? parseInt(req.query.salary_from as string, 10)
          : undefined,
        salaryTo: req.query.salary_to
          ? parseInt(req.query.salary_to as string, 10)
          : undefined,
        experienceLevel: req.query.experience_level as string,
        location: req.query.location as string,
        employmentType: req.query.employment_type as string,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 20,
        offset: req.query.offset ? parseInt(req.query.offset as string, 10) : 0,
      });
      res.json({ items: items.map(toVacancy) });
    } catch (e) {
      next(e);
    }
  }

  static async getPublic(req: Request, res: Response, next: NextFunction) {
    try {
      const { vacancy, company } = await VacancyService.getPublishedDetails(
        routeParam(req.params.id),
      );
      res.json({ vacancy: toVacancy(vacancy), company: toCompany(company) });
    } catch (e) {
      next(e);
    }
  }

  static async upsertCompany(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const company = await VacancyService.upsertCompany(req.user!.userId, {
        name: req.body.name,
        description: req.body.description,
        website: req.body.website,
        industry: req.body.industry,
      });
      res.json(toCompany(company));
    } catch (e) {
      next(e);
    }
  }

  static async employerList(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const items = await VacancyService.employerVacancies(req.user!.userId);
      res.json({ items: items.map(toVacancy) });
    } catch (e) {
      next(e);
    }
  }

  static async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const vacancy = await VacancyService.createVacancy(req.user!.userId, {
        title: req.body.title,
        description: req.body.description,
        requirements: req.body.requirements,
        industry: req.body.industry,
        salaryFrom: req.body.salary_from,
        salaryTo: req.body.salary_to,
        experienceLevel: req.body.experience_level,
        location: req.body.location,
        employmentType: req.body.employment_type,
        status: req.body.status,
      });
      res.status(201).json(toVacancy(vacancy));
    } catch (e) {
      next(e);
    }
  }

  static async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const vacancy = await VacancyService.updateVacancy(
        req.user!.userId,
        routeParam(req.params.id),
        {
          title: req.body.title,
          description: req.body.description,
          requirements: req.body.requirements,
          industry: req.body.industry,
          salaryFrom: req.body.salary_from,
          salaryTo: req.body.salary_to,
          experienceLevel: req.body.experience_level,
          location: req.body.location,
          employmentType: req.body.employment_type,
          status: req.body.status,
        },
      );
      res.json(toVacancy(vacancy));
    } catch (e) {
      next(e);
    }
  }
}
