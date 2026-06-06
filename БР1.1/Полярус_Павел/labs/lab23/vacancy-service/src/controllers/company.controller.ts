import { Request, Response, NextFunction } from 'express';
import { CompanyService } from '../services/company.service';
import { getEmployerByUser } from '../clients/user.client';
import { AppError } from '../utils/errors';

const service = new CompanyService();

export async function getCompanies(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await service.findAll({
      search: req.query.search as string | undefined,
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getCompany(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await service.findOne(req.params.companyId));
  } catch (err) {
    next(err);
  }
}

export async function createCompany(req: Request, res: Response, next: NextFunction) {
  try {
    res.status(201).json(await service.create(req.body));
  } catch (err) {
    next(err);
  }
}

export async function updateCompany(req: Request, res: Response, next: NextFunction) {
  try {
    const employer = await getEmployerByUser(req.user!.sub);
    if (!employer) throw new AppError(404, 'Employer profile not found');
    res.json(await service.update(req.params.companyId, employer.companyId, req.body));
  } catch (err) {
    next(err);
  }
}
