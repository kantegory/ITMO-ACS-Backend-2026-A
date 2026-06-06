import { Router } from 'express';
import { requireInternalSecret } from '../middleware/internal';
import * as ctrl from '../controllers/internal.controller';

const router = Router();

router.use(requireInternalSecret);

router.get('/cities/:id', ctrl.getCityById);
router.get('/industries/:id', ctrl.getIndustryById);
router.get('/skills/:id', ctrl.getSkillById);
router.get('/employment-types/:id', ctrl.getEmploymentTypeById);
router.get('/degree-types/:id', ctrl.getDegreeTypeById);

export default router;
