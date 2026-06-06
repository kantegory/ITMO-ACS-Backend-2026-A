import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/requireRole';
import * as ctrl from '../controllers/vacancy.controller';

const router = Router();

router.get('/vacancies', authenticate, requireRole('EMPLOYER'), ctrl.getEmployerVacancies);

export default router;
