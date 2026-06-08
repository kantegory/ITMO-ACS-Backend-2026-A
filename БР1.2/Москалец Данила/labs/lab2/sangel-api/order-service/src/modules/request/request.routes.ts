import { Router } from 'express';
import { RequestController } from './request.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validation.middleware';
import { CreateRequestSchema, UpdateRequestStatusSchema } from './request.dto';

const router = Router();
const requestController = new RequestController();

// Мои заявки
router.get('/me/requests', authMiddleware, requestController.getMyRequests);

// Создание заявки
router.post('/services/:service_id/requests', authMiddleware, validate(CreateRequestSchema), requestController.createRequest);

// Детали заявки
router.get('/requests/:request_id', authMiddleware, requestController.getRequest);

// Изменение статуса (только OWNER)
router.put('/requests/:request_id/status', authMiddleware, validate(UpdateRequestStatusSchema), requestController.updateStatus);

// Отмена заявки (только автор)
router.put('/requests/:request_id/cancel', authMiddleware, requestController.cancelRequest);

// Заявки компании (только OWNER/ADMIN)
router.get('/companies/:company_id/requests', authMiddleware, requestController.getCompanyRequests);

export default router;