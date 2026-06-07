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
router.get('/', companyController.list);
router.get('/:id', companyController.get);
router.get('/:company_id/services', serviceController.getCompanyServices); 

// Защищенные маршруты
router.use(authMiddleware);

// Моя компания
router.get('/me/company', companyController.getMyCompany);
router.get('/:company_id/report', companyController.getReport);

// CRUD операции
router.post('/', validate(CreateCompanySchema), companyController.create);
router.put('/:id', validate(UpdateCompanySchema), companyController.update);
router.delete('/:id', companyController.delete);

export default router;