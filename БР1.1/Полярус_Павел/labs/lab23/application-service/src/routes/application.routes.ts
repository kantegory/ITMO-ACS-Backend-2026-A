import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/requireRole';
import { validateDto } from '../middleware/validate';
import * as controller from '../controllers/application.controller';
import { CreateApplicationDto, UpdateApplicationStatusDto } from '../dto/ApplicationDto';

const router = Router();

router.post(
  '/',
  authenticate,
  requireRole('SEEKER'),
  validateDto(CreateApplicationDto),
  controller.createApplication
);

router.get(
  '/my',
  authenticate,
  requireRole('SEEKER'),
  controller.getMyApplications
);

router.get(
  '/:id',
  authenticate,
  controller.getApplicationById
);

router.patch(
  '/:id/status',
  authenticate,
  requireRole('EMPLOYER'),
  validateDto(UpdateApplicationStatusDto),
  controller.updateApplicationStatus
);

export default router;