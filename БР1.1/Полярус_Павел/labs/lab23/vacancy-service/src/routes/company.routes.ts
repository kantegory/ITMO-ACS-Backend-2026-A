import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/requireRole';
import { validate } from '../middleware/validate';
import { CreateCompanyDto } from '../dto/CreateCompanyDto';
import * as ctrl from '../controllers/company.controller';

const router = Router();

router.get('/', ctrl.getCompanies);
router.post('/', authenticate, requireRole('EMPLOYER'), validate(CreateCompanyDto), ctrl.createCompany);
router.get('/:companyId', ctrl.getCompany);
router.patch('/:companyId', authenticate, requireRole('EMPLOYER'), validate(CreateCompanyDto), ctrl.updateCompany);

export default router;
