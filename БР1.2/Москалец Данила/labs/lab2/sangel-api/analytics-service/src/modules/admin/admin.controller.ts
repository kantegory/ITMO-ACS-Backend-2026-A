import { Response } from 'express';
import { AdminService } from './admin.service';
import { successResponse, errorResponse } from '../../common/dto';
import { AuthRequest } from '../../middleware/auth.middleware';
import { getPaginationParams, buildPaginatedResponse } from '../../common/pagination';
import { ActivityReportQuerySchema, CompanyReportQuerySchema, UserListQuerySchema } from './admin.dto';
import { parseIdParam } from '../../utils/parse-id-param';

export class AdminController {
  private adminService: AdminService;

  constructor() {
    this.adminService = new AdminService();
  }

  listUsers = async (req: AuthRequest, res: Response) => {
    try {
      const validated = UserListQuerySchema.parse({ query: req.query });
      const [users, total] = await this.adminService.findAllUsers(validated.query);
      
      res.status(200).json(successResponse(
        buildPaginatedResponse(users, total, {
          page: validated.query.page,
          page_size: validated.query.page_size,
        })
      ));
    } catch (error: any) {
      res.status(400).json(errorResponse(400, error.message));
    }
  };

  getUser = async (req: AuthRequest, res: Response) => {
    try {
      const userId = parseIdParam(req.params.user_id, 'user_id');
      const user = await this.adminService.findUserById(userId);
      res.status(200).json(successResponse(user));
    } catch (error: any) {
      if (error.message === 'User not found') {
        res.status(404).json(errorResponse(404, error.message));
      } else {
        res.status(400).json(errorResponse(400, error.message));
      }
    }
  };

  deleteUser = async (req: AuthRequest, res: Response) => {
    try {
      const userId = parseIdParam(req.params.user_id, 'user_id');
      await this.adminService.deleteUser(userId);
      res.status(204).send();
    } catch (error: any) {
      if (error.message === 'User not found') {
        res.status(404).json(errorResponse(404, error.message));
      } else {
        res.status(400).json(errorResponse(400, error.message));
      }
    }
  };

  listCompanies = async (req: AuthRequest, res: Response) => {
    try {
      const { page, page_size } = getPaginationParams(
        req.query.page as any,
        req.query.page_size as any
      );
      const search = req.query.search as string;
      const sortBy = (req.query.sort_by as string) || 'created_at';
      const sortOrder = (req.query.sort_order as 'asc' | 'desc') || 'desc';
      
      const [companies, total] = await this.adminService.findAllCompanies(
        page, page_size, search, sortBy, sortOrder
      );
      
      res.status(200).json(successResponse(
        buildPaginatedResponse(companies, total, { page, page_size })
      ));
    } catch (error: any) {
      res.status(400).json(errorResponse(400, error.message));
    }
  };

  listRequests = async (req: AuthRequest, res: Response) => {
    try {
      const { page, page_size } = getPaginationParams(
        req.query.page as any,
        req.query.page_size as any
      );
      const status = req.query.status as string;
      const companyId = req.query.company_id as any;
      const parsedCompanyId = companyId !== undefined ? Number(companyId) : undefined;
      
      const [requests, total] = await this.adminService.findAllRequests(
        page, page_size, status, parsedCompanyId
      );
      
      res.status(200).json(successResponse(
        buildPaginatedResponse(requests, total, { page, page_size })
      ));
    } catch (error: any) {
      res.status(400).json(errorResponse(400, error.message));
    }
  };

  getActivityReport = async (req: AuthRequest, res: Response) => {
    try {
      const validated = ActivityReportQuerySchema.parse({ query: req.query });
      const report = await this.adminService.getActivityReport(validated.query);
      res.status(200).json(successResponse(report));
    } catch (error: any) {
      res.status(400).json(errorResponse(400, error.message));
    }
  };

  getCompanyReport = async (req: AuthRequest, res: Response) => {
    try {
      const companyId = parseIdParam(req.params.company_id, 'company_id');
      const validated = CompanyReportQuerySchema.parse({ query: req.query });
      const report = await this.adminService.getCompanyReport(companyId, validated.query);
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