import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/requireRole';
import { validate } from '../middleware/validate';
import { UserRole } from '../entities/User';
import { UpdateSeekerProfileDto } from '../dto/UpdateSeekerProfileDto';
import { UpdateEmployerProfileDto } from '../dto/UpdateEmployerProfileDto';
import * as ctrl from '../controllers/profile.controller';

const router = Router();

router.patch(
  '/seeker',
  authenticate,
  requireRole(UserRole.SEEKER),
  validate(UpdateSeekerProfileDto),
  ctrl.updateSeeker,
);

router.patch(
  '/employer',
  authenticate,
  requireRole(UserRole.EMPLOYER),
  validate(UpdateEmployerProfileDto),
  ctrl.updateEmployer,
);

export default router;
