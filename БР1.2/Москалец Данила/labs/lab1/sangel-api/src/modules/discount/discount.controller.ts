import { Request, Response } from 'express';
import { DiscountService } from './discount.service';
import { ServiceService } from '../service/service.service';
import { successResponse, errorResponse } from '../../common/dto';
import { AuthRequest } from '../../middleware/auth.middleware';

export class DiscountController {
  private discountService: DiscountService;
  private serviceService: ServiceService;

  constructor() {
    this.discountService = new DiscountService();
    this.serviceService = new ServiceService();
  }

  // Получить скидку (публичный)
  getDiscount = async (req: Request, res: Response) => {
    try {
      const serviceId = parseInt(req.params.service_id);
      const discount = await this.discountService.findByServiceId(serviceId);
      
      if (!discount) {
        return res.status(404).json(errorResponse(404, 'Discount not found'));
      }

      res.status(200).json(successResponse({
        id: discount.id,
        service_id: discount.service_id,
        percentage: discount.percentage,
        start_at: discount.start_at,
        end_at: discount.end_at,
        is_active: this.discountService.isActive(discount),
      }));
    } catch (error: any) {
      res.status(400).json(errorResponse(400, error.message));
    }
  };

  // Создать скидку (только OWNER)
  createDiscount = async (req: AuthRequest, res: Response) => {
    try {
      const serviceId = parseInt(req.params.service_id);
      const userId = req.user?.userId!;

      const isOwner = await this.serviceService.isOwner(serviceId, userId);
      if (!isOwner && req.user?.role !== 'ADMIN') {
        return res.status(403).json(errorResponse(403, 'Forbidden'));
      }

      const discount = await this.discountService.create(serviceId, req.body);
      res.status(201).json(successResponse({
        id: discount.id,
        service_id: discount.service_id,
        percentage: discount.percentage,
        start_at: discount.start_at,
        end_at: discount.end_at,
        is_active: this.discountService.isActive(discount),
      }));
    } catch (error: any) {
      if (error.message === 'Discount already exists for this service') {
        res.status(409).json(errorResponse(409, error.message));
      } else if (error.message === 'Service not found') {
        res.status(404).json(errorResponse(404, error.message));
      } else {
        res.status(400).json(errorResponse(400, error.message));
      }
    }
  };

  // Обновить скидку (только OWNER)
  updateDiscount = async (req: AuthRequest, res: Response) => {
    try {
      const serviceId = parseInt(req.params.service_id);
      const userId = req.user?.userId!;

      const isOwner = await this.serviceService.isOwner(serviceId, userId);
      if (!isOwner && req.user?.role !== 'ADMIN') {
        return res.status(403).json(errorResponse(403, 'Forbidden'));
      }

      const discount = await this.discountService.update(serviceId, req.body);
      res.status(200).json(successResponse({
        id: discount.id,
        service_id: discount.service_id,
        percentage: discount.percentage,
        start_at: discount.start_at,
        end_at: discount.end_at,
        is_active: this.discountService.isActive(discount),
      }));
    } catch (error: any) {
      if (error.message === 'Discount not found') {
        res.status(404).json(errorResponse(404, error.message));
      } else {
        res.status(400).json(errorResponse(400, error.message));
      }
    }
  };

  // Удалить скидку (только OWNER)
  deleteDiscount = async (req: AuthRequest, res: Response) => {
    try {
      const serviceId = parseInt(req.params.service_id);
      const userId = req.user?.userId!;

      const isOwner = await this.serviceService.isOwner(serviceId, userId);
      if (!isOwner && req.user?.role !== 'ADMIN') {
        return res.status(403).json(errorResponse(403, 'Forbidden'));
      }

      await this.discountService.delete(serviceId);
      res.status(204).send();
    } catch (error: any) {
      if (error.message === 'Discount not found') {
        res.status(404).json(errorResponse(404, error.message));
      } else {
        res.status(400).json(errorResponse(400, error.message));
      }
    }
  };
}