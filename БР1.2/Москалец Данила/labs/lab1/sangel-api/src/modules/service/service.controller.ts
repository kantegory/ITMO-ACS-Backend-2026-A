import { Request, Response } from 'express';
import { ServiceService } from './service.service';
import { DiscountService } from '../discount/discount.service';
import { successResponse, errorResponse } from '../../common/dto';
import { AuthRequest } from '../../middleware/auth.middleware';
import { getPaginationParams, buildPaginatedResponse } from '../../common/pagination';
import { ServiceListQuerySchema } from './service.dto';
import { AppDataSource } from '../../config/database';
import { Review } from '../review/review.entity';

export class ServiceController {
  private serviceService: ServiceService;
  private discountService: DiscountService;

  constructor() {
    this.serviceService = new ServiceService();
    this.discountService = new DiscountService();
  }

  // Получить услуги компании (публичный)
  getCompanyServices = async (req: Request, res: Response) => {
    try {
      const companyId = parseInt(req.params.company_id);
      const { page, page_size } = getPaginationParams(
        req.query.page as any,
        req.query.page_size as any
      );
      const categoryId = req.query.category_id as any;
      const sortBy = (req.query.sort_by as string) || 'created_at';
      const sortOrder = (req.query.sort_order as 'asc' | 'desc') || 'desc';

      const [services, total] = await this.serviceService.getCompanyServicesPublic(
        companyId, page, page_size, categoryId, sortBy, sortOrder
      );

      const enrichedServices = await this.enrichServices(services);
      res.status(200).json(successResponse(
        buildPaginatedResponse(enrichedServices, total, { page, page_size })
      ));
    } catch (error: any) {
      res.status(400).json(errorResponse(400, error.message));
    }
  };

  // Создать услугу (только OWNER)
  createService = async (req: AuthRequest, res: Response) => {
    try {
      const companyId = parseInt(req.params.company_id);
      const userId = req.user?.userId!;

      const { CompanyService } = await import('../company/company.service');
      const companyService = new CompanyService();
      const company = await companyService.findById(companyId);
      
      if (company.user_id !== userId) {
        return res.status(403).json(errorResponse(403, 'You are not the owner of this company'));
      }

      const service = await this.serviceService.create(companyId, req.body);
      const enriched = (await this.enrichServices([service]))[0];
      res.status(201).json(successResponse(enriched));
    } catch (error: any) {
      if (error.message === 'Company not found') {
        res.status(404).json(errorResponse(404, error.message));
      } else {
        res.status(400).json(errorResponse(400, error.message));
      }
    }
  };

  // Каталог услуг (публичный с фильтрацией)
  getCatalog = async (req: Request, res: Response) => {
    try {
      const validated = ServiceListQuerySchema.parse({ query: req.query });
      const [services, total] = await this.serviceService.getCatalog(validated.query);
      
      const enrichedServices = await this.enrichServices(services);
      res.status(200).json(successResponse(
        buildPaginatedResponse(enrichedServices, total, {
          page: validated.query.page,
          page_size: validated.query.page_size,
        })
      ));
    } catch (error: any) {
      res.status(400).json(errorResponse(400, error.message));
    }
  };

  // Детали услуги (публичный)
  getService = async (req: Request, res: Response) => {
    try {
      const serviceId = parseInt(req.params.service_id);
      const service = await this.serviceService.findById(serviceId);
      const enriched = (await this.enrichServices([service]))[0];
      res.status(200).json(successResponse(enriched));
    } catch (error: any) {
      if (error.message === 'Service not found') {
        res.status(404).json(errorResponse(404, error.message));
      } else {
        res.status(400).json(errorResponse(400, error.message));
      }
    }
  };

  // Обновить услугу (только OWNER)
  updateService = async (req: AuthRequest, res: Response) => {
    try {
      const serviceId = parseInt(req.params.service_id);
      const userId = req.user?.userId!;

      const isOwner = await this.serviceService.isOwner(serviceId, userId);
      if (!isOwner && req.user?.role !== 'ADMIN') {
        return res.status(403).json(errorResponse(403, 'Forbidden'));
      }

      const service = await this.serviceService.update(serviceId, req.body);
      const enriched = (await this.enrichServices([service]))[0];
      res.status(200).json(successResponse(enriched));
    } catch (error: any) {
      if (error.message === 'Service not found') {
        res.status(404).json(errorResponse(404, error.message));
      } else {
        res.status(400).json(errorResponse(400, error.message));
      }
    }
  };

  // Удалить услугу (только OWNER)
  deleteService = async (req: AuthRequest, res: Response) => {
    try {
      const serviceId = parseInt(req.params.service_id);
      const userId = req.user?.userId!;

      const isOwner = await this.serviceService.isOwner(serviceId, userId);
      if (!isOwner && req.user?.role !== 'ADMIN') {
        return res.status(403).json(errorResponse(403, 'Forbidden'));
      }

      await this.serviceService.delete(serviceId);
      res.status(204).send();
    } catch (error: any) {
      if (error.message === 'Service not found') {
        res.status(404).json(errorResponse(404, error.message));
      } else {
        res.status(400).json(errorResponse(400, error.message));
      }
    }
  };

  // Helper: обогатить услуги информацией о скидках, категориях, финальной цене и рейтинге
  private async enrichServices(services: any[]): Promise<any[]> {
    if (services.length === 0) return [];
    
    // Получаем ID всех услуг
    const serviceIds = services.map(s => s.id);
    
    // Один запрос для получения рейтингов всех услуг
    const ratings = await AppDataSource.getRepository(Review)
      .createQueryBuilder('review')
      .select('review.service_id', 'serviceId')
      .addSelect('AVG(review.rating)', 'avg_rating')
      .addSelect('COUNT(review.id)', 'total_reviews')
      .where('review.service_id IN (:...serviceIds)', { serviceIds })
      .groupBy('review.service_id')
      .getRawMany();
    
    // Создаем Map для быстрого доступа к рейтингам
    const ratingMap = new Map(
      ratings.map(r => [r.serviceId, {
        avg_rating: r.avg_rating ? parseFloat(r.avg_rating) : null,
        total_reviews: parseInt(r.total_reviews) || 0,
      }])
    );
    
    return services.map((service) => {
      const discount = service.discount;
      const finalPrice = this.discountService.calculateFinalPrice(service.base_price, discount);
      const rating = ratingMap.get(service.id) || { avg_rating: null, total_reviews: 0 };
      
      const categories = service.service_categories?.map((sc: any) => ({
        id: sc.category.id,
        title: sc.category.title,
      })) || [];

      return {
        id: service.id,
        company_id: service.company_id,
        company_title: service.company?.title || '',
        name: service.name,
        description: service.description,
        price: Number(service.base_price), // Исправлено: Number() вместо parseFloat()
        final_price: finalPrice,
        discount: discount ? {
          id: discount.id,
          percentage: discount.percentage,
          start_at: discount.start_at,
          end_at: discount.end_at,
          is_active: this.discountService.isActive(discount),
        } : null,
        is_published: service.is_published,
        categories,
        avg_rating: rating.avg_rating,     
        total_reviews: rating.total_reviews,
        created_at: service.created_at,
      };
    });
  }
}