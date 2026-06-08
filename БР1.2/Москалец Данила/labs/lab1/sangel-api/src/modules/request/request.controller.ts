import { Response } from 'express';
import { RequestService } from './request.service';
import { successResponse, errorResponse } from '../../common/dto';
import { AuthRequest } from '../../middleware/auth.middleware';
import { getPaginationParams, buildPaginatedResponse } from '../../common/pagination';
import { RequestListQuerySchema } from './request.dto';
import { parseIdParam } from '../../utils/parse-id-param';

export class RequestController {
  private requestService: RequestService;

  constructor() {
    this.requestService = new RequestService();
  }

  // Мои заявки (отправленные)
  getMyRequests = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.userId!;
      const validated = RequestListQuerySchema.parse({ query: req.query });
      
      const [requests, total] = await this.requestService.findUserRequests(
        userId,
        validated.query
      );
      
      const enriched = this.enrichRequests(requests);
      res.status(200).json(successResponse(
        buildPaginatedResponse(enriched, total, {
          page: validated.query.page,
          page_size: validated.query.page_size,
        })
      ));
    } catch (error: any) {
      res.status(400).json(errorResponse(400, error.message));
    }
  };

  // Заявки компании (входящие)
  getCompanyRequests = async (req: AuthRequest, res: Response) => {
    try {
      const companyId = parseIdParam(req.params.company_id, 'company_id');
      const userId = req.user?.userId!;
      const isAdmin = req.user?.role === 'ADMIN';
      
      // Проверяем права (владелец компании или ADMIN)
      const { CompanyService } = await import('../company/company.service');
      const companyService = new CompanyService();
      const company = await companyService.findById(companyId);
      
      if (company.user_id !== userId && !isAdmin) {
        return res.status(403).json(errorResponse(403, 'Forbidden'));
      }
      
      const validated = RequestListQuerySchema.parse({ query: req.query });
      
      const [requests, total] = await this.requestService.findCompanyRequests(
        companyId,
        validated.query
      );
      
      const enriched = this.enrichRequests(requests);
      res.status(200).json(successResponse(
        buildPaginatedResponse(enriched, total, {
          page: validated.query.page,
          page_size: validated.query.page_size,
        })
      ));
    } catch (error: any) {
      if (error.message === 'Company not found') {
        res.status(404).json(errorResponse(404, error.message));
      } else {
        res.status(400).json(errorResponse(400, error.message));
      }
    }
  };

  // Создать заявку
  createRequest = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.userId!;
      const serviceId = parseIdParam(req.params.service_id, 'service_id');
      
      const request = await this.requestService.create(userId, serviceId, req.body);
      const enriched = this.enrichRequests([request])[0];
      res.status(201).json(successResponse(enriched));
    } catch (error: any) {
      if (error.message === 'Service not found') {
        res.status(404).json(errorResponse(404, error.message));
      } else if (error.message === 'Cannot create request for your own service') {
        res.status(403).json(errorResponse(403, error.message));
      } else if (error.message === 'You already have a pending request for this service') {
        res.status(409).json(errorResponse(409, error.message));
      } else {
        res.status(400).json(errorResponse(400, error.message));
      }
    }
  };

  // Получить детали заявки
  getRequest = async (req: AuthRequest, res: Response) => {
    try {
      const requestId = parseIdParam(req.params.request_id, 'request_id');
      const userId = req.user?.userId!;
      const isAdmin = req.user?.role === 'ADMIN';
      
      const request = await this.requestService.findById(requestId);
      
      // Проверка прав: автор, владелец компании, ADMIN
      const isOwner = request.service.company.user_id === userId;
      if (request.user_id !== userId && !isOwner && !isAdmin) {
        return res.status(403).json(errorResponse(403, 'Forbidden'));
      }
      
      const enriched = this.enrichRequests([request])[0];
      res.status(200).json(successResponse(enriched));
    } catch (error: any) {
      if (error.message === 'Request not found') {
        res.status(404).json(errorResponse(404, error.message));
      } else {
        res.status(400).json(errorResponse(400, error.message));
      }
    }
  };

  // Изменить статус заявки (OWNER)
  updateStatus = async (req: AuthRequest, res: Response) => {
    try {
      const requestId = parseIdParam(req.params.request_id, 'request_id');
      const userId = req.user?.userId!;
      const isAdmin = req.user?.role === 'ADMIN';
      
      const request = await this.requestService.updateStatus(requestId, userId, req.body, isAdmin);
      const enriched = this.enrichRequests([request])[0];
      res.status(200).json(successResponse(enriched));
    } catch (error: any) {
      if (error.message === 'Request not found') {
        res.status(404).json(errorResponse(404, error.message));
      } else if (error.message === 'Forbidden') {
        res.status(403).json(errorResponse(403, error.message));
      } else if (error.message?.startsWith('Cannot change status')) {
        res.status(400).json(errorResponse(400, error.message));
      } else {
        res.status(400).json(errorResponse(400, error.message));
      }
    }
  };

  // Отменить заявку (автор)
  cancelRequest = async (req: AuthRequest, res: Response) => {
    try {
      const requestId = parseIdParam(req.params.request_id, 'request_id');
      const userId = req.user?.userId!;
      
      const request = await this.requestService.cancel(requestId, userId);
      const enriched = this.enrichRequests([request])[0];
      res.status(200).json(successResponse(enriched));
    } catch (error: any) {
      if (error.message === 'Request not found') {
        res.status(404).json(errorResponse(404, error.message));
      } else if (error.message === 'Forbidden') {
        res.status(403).json(errorResponse(403, error.message));
      } else if (error.message?.startsWith('Cannot cancel')) {
        res.status(400).json(errorResponse(400, error.message));
      } else {
        res.status(400).json(errorResponse(400, error.message));
      }
    }
  };

  private enrichRequests(requests: any[]): any[] {
    return requests.map(request => ({
      id: request.id,
      service: {
        id: request.service.id,
        name: request.service.name,
        company: {
          id: request.service.company.id,
          title: request.service.company.title,
        },
      },
      user: {
        id: request.user.id,
        first_name: request.user.first_name,
        last_name: request.user.last_name,
      },
      status: request.status,
      description: request.description,
      reply: request.reply,
      created_at: request.created_at,
      updated_at: request.updated_at,
    }));
  }
}