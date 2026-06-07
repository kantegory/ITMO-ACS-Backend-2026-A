import { Router } from 'express';
import { ServiceController } from './service.controller';
import { DiscountController } from '../discount/discount.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validation.middleware';
import { CreateServiceSchema, UpdateServiceSchema } from './service.dto';
import { DiscountSchema } from '../discount/discount.dto';

const router = Router();
const serviceController = new ServiceController();
const discountController = new DiscountController();

// Публичные маршруты
router.get('/services', serviceController.getCatalog);
router.get('/services/:service_id', serviceController.getService);
router.get('/companies/:company_id/services', serviceController.getCompanyServices);

// Маршруты для скидок (публичный)
router.get('/services/:service_id/discount', discountController.getDiscount);

// Защищенные маршруты
router.use(authMiddleware);

// CRUD услуг (только OWNER)
router.post('/companies/:company_id/services', validate(CreateServiceSchema), serviceController.createService);
router.put('/services/:service_id', validate(UpdateServiceSchema), serviceController.updateService);
router.delete('/services/:service_id', serviceController.deleteService);

// CRUD скидок (только OWNER)
router.post('/services/:service_id/discount', validate(DiscountSchema), discountController.createDiscount);
router.put('/services/:service_id/discount', validate(DiscountSchema), discountController.updateDiscount);
router.delete('/services/:service_id/discount', discountController.deleteDiscount);

export default router;