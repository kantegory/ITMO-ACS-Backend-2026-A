import { Response } from 'express';
import { RequestService } from './request.service';
import { successResponse, errorResponse } from '../../common/dto';
import { AuthRequest } from '../../middleware/auth.middleware';
import { getPaginationParams, buildPaginatedResponse } from '../../common/pagination';
import { RequestListQuerySchema } from './request.dto';
import { parseIdParam } from '../../utils/parse-id-param';
import axios from 'axios';
import { settings } from '../../config/settings';

export class RequestController {
  private requestService: RequestService;

  constructor() {
    this.requestService = new RequestService();
  }

  getMyRequests = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.userId!;
      const validated = RequestListQuerySchema.parse({ query: req.query });
      
      const [requests, total] = await this.requestService.findUserRequests(
        userId,
        validated.query
      );
      
      const enriched = await this.enrichRequests(requests);
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

  getCompanyRequests = async (req: AuthRequest, res: Response) => {
    try {
      const companyId = parseIdParam(req.params.company_id, 'company_id');
      const userId = req.user?.userId!;
      const isAdmin = req.user?.role === 'ADMIN';
      
      const companyResponse = await axios.get(`${settings.companyServiceUrl}/api/v1/companies/${companyId}`);
      const company = companyResponse.data.data;
      
      if (company.owner.id !== userId && !isAdmin) {
        return res.status(403).json(errorResponse(403, 'Forbidden'));
      }
      
      const validated = RequestListQuerySchema.parse({ query: req.query });
      
      const [requests, total] = await this.requestService.findCompanyRequests(
        companyId,
        validated.query
      );
      
      const enriched = await this.enrichRequests(requests);
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

  createRequest = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.userId!;
      const serviceId = parseIdParam(req.params.service_id, 'service_id');
      
      const request = await this.requestService.create(userId, serviceId, req.body);
      const enriched = (await this.enrichRequests([request]))[0];
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

  getRequest = async (req: AuthRequest, res: Response) => {
    try {
      const requestId = parseIdParam(req.params.request_id, 'request_id');
      const userId = req.user?.userId!;
      const isAdmin = req.user?.role === 'ADMIN';
      
      const request = await this.requestService.findById(requestId);
      
      const service = await this.getServiceInfo(request.service_id);
      const isOwner = service.company_id ? true : false; // Simplified, needs proper check
      
      if (request.user_id !== userId && !isOwner && !isAdmin) {
        return res.status(403).json(errorResponse(403, 'Forbidden'));
      }
      
      const enriched = (await this.enrichRequests([request]))[0];
      res.status(200).json(successResponse(enriched));
    } catch (error: any) {
      if (error.message === 'Request not found') {
        res.status(404).json(errorResponse(404, error.message));
      } else {
        res.status(400).json(errorResponse(400, error.message));
      }
    }
  };

  updateStatus = async (req: AuthRequest, res: Response) => {
    try {
      const requestId = parseIdParam(req.params.request_id, 'request_id');
      const userId = req.user?.userId!;
      const isAdmin = req.user?.role === 'ADMIN';
      
      const request = await this.requestService.updateStatus(requestId, userId, req.body, isAdmin);
      const enriched = (await this.enrichRequests([request]))[0];
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

  cancelRequest = async (req: AuthRequest, res: Response) => {
    try {
      const requestId = parseIdParam(req.params.request_id, 'request_id');
      const userId = req.user?.userId!;
      
      const request = await this.requestService.cancel(requestId, userId);
      const enriched = (await this.enrichRequests([request]))[0];
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

  private async getServiceInfo(serviceId: number): Promise<any> {
    try {
      const response = await axios.get(`${settings.companyServiceUrl}/api/v1/services/${serviceId}`);
      return response.data.data;
    } catch (error: any) {
      return null;
    }
  }

  private async getUserInfo(userId: number): Promise<any> {
    try {
      const response = await axios.get(`${settings.userServiceUrl}/internal/users/${userId}`);
      return response.data;
    } catch (error: any) {
      return null;
    }
  }

  private async enrichRequests(requests: any[]): Promise<any[]> {
    const enriched = [];
    for (const request of requests) {
      const service = await this.getServiceInfo(request.service_id);
      const user = await this.getUserInfo(request.user_id);
      
      enriched.push({
        id: request.id,
        service: service ? {
          id: service.id,
          name: service.name,
          company: {
            id: service.company_id,
            title: service.company_title || '',
          },
        } : null,
        user: user ? {
          id: user.id,
          first_name: user.first_name,
          last_name: user.last_name,
        } : { id: request.user_id, first_name: '', last_name: '' },
        status: request.status,
        description: request.description,
        reply: request.reply,
        created_at: request.created_at,
        updated_at: request.updated_at,
      });
    }
    return enriched;
  }
}