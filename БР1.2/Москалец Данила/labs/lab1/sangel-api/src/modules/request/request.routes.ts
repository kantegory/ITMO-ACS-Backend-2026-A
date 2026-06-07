import { Router } from 'express';
import { RequestController } from './request.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validation.middleware';
import { CreateRequestSchema, UpdateRequestStatusSchema } from './request.dto';

const router = Router();
const requestController = new RequestController();

// Все маршруты требуют аутентификации
router.use(authMiddleware);

// Мои заявки
router.get('/me/requests', requestController.getMyRequests);

// Создание заявки
router.post('/services/:service_id/requests', validate(CreateRequestSchema), requestController.createRequest);

// Детали заявки
router.get('/requests/:request_id', requestController.getRequest);

// Изменение статуса (OWNER)
router.put('/requests/:request_id/status', validate(UpdateRequestStatusSchema), requestController.updateStatus);

// Отмена заявки (автор)
router.put('/requests/:request_id/cancel', requestController.cancelRequest);

// Заявки компании (OWNER/ADMIN)
router.get('/companies/:company_id/requests', requestController.getCompanyRequests);

export default router;