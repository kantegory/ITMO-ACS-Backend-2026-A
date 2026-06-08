import { Router } from 'express';
import { RequestController } from './request.controller';
import { authMiddleware, roleMiddleware } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validation.middleware';
import { CreateRequestSchema, UpdateRequestStatusSchema } from './request.dto';

const router = Router();
const requestController = new RequestController();

// Все маршруты требуют аутентификации (кроме создания заявки, но создание заявки тоже требует авторизации)
// Мои заявки
router.get('/me/requests', authMiddleware, requestController.getMyRequests);

// Создание заявки (только авторизованные клиенты)
router.post('/services/:service_id/requests', authMiddleware, validate(CreateRequestSchema), requestController.createRequest);

// Детали заявки (автор или владелец компании)
router.get('/requests/:request_id', authMiddleware, requestController.getRequest);

// Изменение статуса (только OWNER)
router.put('/requests/:request_id/status', authMiddleware, validate(UpdateRequestStatusSchema), requestController.updateStatus);

// Отмена заявки (только автор)
router.put('/requests/:request_id/cancel', authMiddleware, requestController.cancelRequest);

// Заявки компании (только OWNER/ADMIN)
router.get('/companies/:company_id/requests', authMiddleware, requestController.getCompanyRequests);

export default router;