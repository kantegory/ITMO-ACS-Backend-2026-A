import { Router } from 'express';
import { requireInternalSecret } from '../middleware/internal';
import * as ctrl from '../controllers/internal.controller';

const router = Router();

router.use(requireInternalSecret);
router.get('/vacancies/:vacancyId', ctrl.getVacancyById);

export default router;
