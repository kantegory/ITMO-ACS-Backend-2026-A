import { Router } from 'express';
import * as ctrl from '../controllers/dictionary.controller';

const router = Router();

router.get('/countries', ctrl.getCountries);
router.get('/cities', ctrl.getCities);
router.get('/industries', ctrl.getIndustries);
router.get('/skills', ctrl.getSkills);
router.get('/employment-types', ctrl.getEmploymentTypes);
router.get('/degree-types', ctrl.getDegreeTypes);

export default router;
