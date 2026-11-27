import { Router } from 'express';
import { CompanyController } from './company.controller';
import { authMiddleware, roleMiddleware } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validation.middleware';
import { CreateCompanySchema, UpdateCompanySchema } from './company.dto';
import { ServiceController } from '../service/service.controller';

const router = Router();
const companyController = new CompanyController();
const serviceController = new ServiceController();

// Публичные маршруты
router.get('/companies', companyController.list);
router.get('/companies/:company_id/services', serviceController.getCompanyServices);
router.get('/companies/:id', companyController.get);

// Защищённые маршруты
router.get('/me/company', authMiddleware, companyController.getMyCompany);
router.get('/companies/:company_id/report', authMiddleware, roleMiddleware(['OWNER', 'ADMIN']), companyController.getReport);

// CRUD операции (требуют владельца или админа)
router.post('/companies/', authMiddleware, validate(CreateCompanySchema), companyController.create);
router.put('/companies/:id', authMiddleware, roleMiddleware(['OWNER', 'ADMIN']), validate(UpdateCompanySchema), companyController.update);
router.delete('/companies/:id', authMiddleware, roleMiddleware(['OWNER', 'ADMIN']), companyController.delete);

export default router;