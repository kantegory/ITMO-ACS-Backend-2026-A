import { Request, Response } from 'express';
import { CompanyService } from './company.service';
import { successResponse, errorResponse } from '../../common/dto';
import { AuthRequest } from '../../middleware/auth.middleware';
import { getPaginationParams, buildPaginatedResponse } from '../../common/pagination';
import { parseIdParam } from '../../utils/parse-id-param';

export class CompanyController {
  private companyService: CompanyService;

  constructor() {
    this.companyService = new CompanyService();
  }

  list = async (req: Request, res: Response) => {
    try {
      const { page, page_size } = getPaginationParams(
        req.query.page as any,
        req.query.page_size as any
      );
      
      const search = req.query.search as string;
      const sortBy = (req.query.sort_by as string) || 'created_at';
      const sortOrder = (req.query.sort_order as 'asc' | 'desc') || 'desc';
      
      const [companies, total] = await this.companyService.findAll(
        page, page_size, search, sortBy, sortOrder
      );
      
      const enrichedCompanies = companies.map(c => ({
        id: c.id,
        title: c.title,
        description: c.description,
        logo_url: c.logo_url,
        website: c.website,
        avg_rating: null,
        total_reviews: 0,
        total_services: 0,
        created_at: c.created_at,
      }));
      
      res.status(200).json(successResponse(
        buildPaginatedResponse(enrichedCompanies, total, { page, page_size })
      ));
    } catch (error: any) {
      res.status(400).json(errorResponse(400, error.message));
    }
  };

  get = async (req: Request, res: Response) => {
    try {
      const id = parseIdParam(req.params.id, 'id');
      const company = await this.companyService.getCompanyResponse(id);
      res.status(200).json(successResponse(company));
    } catch (error: any) {
      if (error.message === 'Company not found') {
        res.status(404).json(errorResponse(404, error.message));
      } else {
        res.status(400).json(errorResponse(400, error.message));
      }
    }
  };

  create = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.userId!;
      const company = await this.companyService.create(userId, req.body);
      
      const response = await this.companyService.getCompanyResponse(company.id);
      res.status(201).json(successResponse(response));
    } catch (error: any) {
      if (error.message === 'User already owns a company') {
        res.status(403).json(errorResponse(403, error.message));
      } else {
        res.status(400).json(errorResponse(400, error.message));
      }
    }
  };

  update = async (req: AuthRequest, res: Response) => {
    try {
      const id = parseIdParam(req.params.id, 'id');
      const userId = req.user?.userId!;
      const isAdmin = req.user?.role === 'ADMIN';
      
      const company = await this.companyService.update(id, userId, req.body, isAdmin);
      const response = await this.companyService.getCompanyResponse(company.id);
      res.status(200).json(successResponse(response));
    } catch (error: any) {
      if (error.message === 'Company not found') {
        res.status(404).json(errorResponse(404, error.message));
      } else if (error.message === 'Forbidden') {
        res.status(403).json(errorResponse(403, error.message));
      } else {
        res.status(400).json(errorResponse(400, error.message));
      }
    }
  };

  delete = async (req: AuthRequest, res: Response) => {
    try {
      const id = parseIdParam(req.params.id, 'id');
      const userId = req.user?.userId!;
      const isAdmin = req.user?.role === 'ADMIN';
      
      await this.companyService.delete(id, userId, isAdmin);
      res.status(204).send();
    } catch (error: any) {
      if (error.message === 'Company not found') {
        res.status(404).json(errorResponse(404, error.message));
      } else if (error.message === 'Forbidden') {
        res.status(403).json(errorResponse(403, error.message));
      } else {
        res.status(400).json(errorResponse(400, error.message));
      }
    }
  };

  getMyCompany = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.userId!;
      const company = await this.companyService.findByUserId(userId);
      
      if (!company) {
        return res.status(404).json(errorResponse(404, 'Company not found'));
      }
      
      const response = await this.companyService.getCompanyResponse(company.id);
      res.status(200).json(successResponse(response));
    } catch (error: any) {
      res.status(400).json(errorResponse(400, error.message));
    }
  };
}