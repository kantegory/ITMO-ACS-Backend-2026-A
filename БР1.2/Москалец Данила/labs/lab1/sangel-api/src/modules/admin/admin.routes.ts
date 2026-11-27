import { Router } from 'express';
import { AdminController } from './admin.controller';
import { authMiddleware, roleMiddleware } from '../../middleware/auth.middleware';

const router = Router();
const adminController = new AdminController();

// Все маршруты требуют аутентификации и роль ADMIN
router.use(authMiddleware);
router.use(roleMiddleware(['ADMIN']));

// Управление пользователями
router.get('/users', adminController.listUsers);
router.get('/users/:user_id', adminController.getUser);
router.delete('/users/:user_id', adminController.deleteUser);

// Управление компаниями
router.get('/companies', adminController.listCompanies);

// Управление заявками
router.get('/requests', adminController.listRequests);

// Отчеты
router.get('/reports/activity', adminController.getActivityReport);
router.get('/companies/:company_id/report', adminController.getCompanyReport);

export default router;