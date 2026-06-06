import { Request, Response, NextFunction } from 'express';
import { CompanyService } from '../services/company.service';

const service = new CompanyService();

export const getCompanies = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await service.findAll({
      search: req.query.search as string | undefined,
      industryId: req.query.industryId as string | undefined,
      cityId: req.query.cityId as string | undefined,
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const getCompany = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await service.findOne(req.params.companyId);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const createCompany = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await service.create(req.user!.sub, req.body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

export const updateCompany = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await service.update(req.params.companyId, req.user!.sub, req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
};
