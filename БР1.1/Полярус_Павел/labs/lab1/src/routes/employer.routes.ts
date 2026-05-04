import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/requireRole';
import { UserRole } from '../entities/User';
import { getEmployerVacancies } from '../controllers/vacancy.controller';

const router = Router();

router.use(authenticate, requireRole(UserRole.EMPLOYER));

router.get('/vacancies', getEmployerVacancies);

export default router;
