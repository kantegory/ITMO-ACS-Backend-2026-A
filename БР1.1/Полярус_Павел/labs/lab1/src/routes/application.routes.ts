import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/requireRole';
import { validate } from '../middleware/validate';
import { UserRole } from '../entities/User';
import { CreateApplicationDto, UpdateApplicationStatusDto } from '../dto/ApplicationDto';
import * as ctrl from '../controllers/application.controller';

const router = Router();

router.use(authenticate);

router.post(
  '/',
  requireRole(UserRole.SEEKER),
  validate(CreateApplicationDto),
  ctrl.createApplication,
);

router.get('/my', requireRole(UserRole.SEEKER), ctrl.getMyApplications);

router.get(
  '/:applicationId',
  requireRole(UserRole.SEEKER, UserRole.EMPLOYER),
  ctrl.getApplication,
);

router.patch(
  '/:applicationId/status',
  requireRole(UserRole.EMPLOYER),
  validate(UpdateApplicationStatusDto),
  ctrl.updateStatus,
);

export default router;
