// src/modules/company/company.controller.ts
import { Request, Response } from 'express';
import { CompanyService } from './company.service';
import { successResponse, errorResponse } from '../../common/dto';
import { AuthRequest } from '../../middleware/auth.middleware';
import { getPaginationParams, buildPaginatedResponse } from '../../common/pagination';
import { AppDataSource } from '../../config/database';
import { Service } from '../service/service.entity';
import { Review } from '../review/review.entity';

export class CompanyController {
  private companyService: CompanyService;

  constructor() {
    this.companyService = new CompanyService();
  }

  // Публичный - список компаний (с рейтингом и количеством услуг)
  list = async (req: Request, res: Response) => {
    try {
      const { page, page_size } = getPaginationParams(
        req.query.page as any,
        req.query.page_size as any
      );
      
      const search = req.query.search as string;
      const sortBy = (req.query.sort_by as string) || 'created_at';
      const sortOrder = (req.query.sort_order as 'asc' | 'desc') || 'desc';
      
      const categoryId = req.query.category_id as any;
      if (categoryId) {
        return res.status(400).json(errorResponse(400, 
          'Filter by category will be available in next version (requires services module)'
        ));
      }
      
      const [companies, total] = await this.companyService.findAll(
        page, page_size, search, sortBy, sortOrder
      );
      
      // Обогащаем компаниями данными о рейтинге и услугах
      const enrichedCompanies = await Promise.all(
        companies.map(async (c) => {
          // Количество услуг компании
          const serviceCount = await AppDataSource.getRepository(Service).count({
            where: { company_id: c.id, is_published: true },
          });
          
          // Рейтинг компании на основе отзывов об услугах
          const ratingResult = await AppDataSource.getRepository(Review)
            .createQueryBuilder('review')
            .innerJoin('review.service', 'service')
            .where('service.company_id = :companyId', { companyId: c.id })
            .select('AVG(review.rating)', 'avg_rating')
            .addSelect('COUNT(review.id)', 'total_reviews')
            .getRawOne();
          
          const avgRating = ratingResult?.avg_rating ? parseFloat(ratingResult.avg_rating) : null;
          const totalReviews = ratingResult?.total_reviews ? parseInt(ratingResult.total_reviews) : 0;
          
          return {
            id: c.id,
            title: c.title,
            description: c.description,
            logo_url: c.logo_url,
            website: c.website,
            avg_rating: avgRating, 
            total_reviews: totalReviews,
            total_services: serviceCount,
            created_at: c.created_at,
          };
        })
      );
      
      res.status(200).json(successResponse(
        buildPaginatedResponse(enrichedCompanies, total, { page, page_size })
      ));
    } catch (error: any) {
      res.status(400).json(errorResponse(400, error.message));
    }
  };

  // Публичный - детали компании
  get = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
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

  // Создать компанию (только для USER, который еще не OWNER)
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

  // Обновить компанию
  update = async (req: AuthRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);
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

  // Удалить компанию
  delete = async (req: AuthRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);
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

  // Получить компанию текущего пользователя
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

  // Отчет по компании (для OWNER и ADMIN)
  getReport = async (req: AuthRequest, res: Response) => {
    try {
      const companyId = parseInt(req.params.company_id);
      const userId = req.user?.userId!;
      const isAdmin = req.user?.role === 'ADMIN';
      
      const company = await this.companyService.findById(companyId);
      if (company.user_id !== userId && !isAdmin) {
        return res.status(403).json(errorResponse(403, 'Forbidden'));
      }
      
      const { AdminService } = await import('../admin/admin.service');
      const adminService = new AdminService();
      const report = await adminService.getCompanyReport(companyId, req.query);
      
      res.status(200).json(successResponse(report));
    } catch (error: any) {
      if (error.message === 'Company not found') {
        res.status(404).json(errorResponse(404, error.message));
      } else {
        res.status(400).json(errorResponse(400, error.message));
      }
    }
  };
}