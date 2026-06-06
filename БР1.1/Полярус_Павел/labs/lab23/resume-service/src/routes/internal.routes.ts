import { Router } from 'express';
import { requireInternalSecret } from '../middleware/internal';
import * as ctrl from '../controllers/internal.controller';

const router = Router();
router.use(requireInternalSecret);
router.get('/resumes/:resumeId', ctrl.getResumeById);

export default router;
