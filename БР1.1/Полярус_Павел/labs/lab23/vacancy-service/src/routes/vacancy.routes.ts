import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/requireRole';
import { validate } from '../middleware/validate';
import { CreateVacancyDto, UpdateVacancyDto, AddVacancySkillDto } from '../dto/VacancyDto';
import * as ctrl from '../controllers/vacancy.controller';

const router = Router();

router.get('/', ctrl.getVacancies);
router.post('/', authenticate, requireRole('EMPLOYER'), validate(CreateVacancyDto), ctrl.createVacancy);

router.get('/:vacancyId', ctrl.getVacancy);
router.patch('/:vacancyId', authenticate, requireRole('EMPLOYER'), validate(UpdateVacancyDto), ctrl.updateVacancy);
router.delete('/:vacancyId', authenticate, requireRole('EMPLOYER'), ctrl.deleteVacancy);

router.post('/:vacancyId/skills', authenticate, requireRole('EMPLOYER'), validate(AddVacancySkillDto), ctrl.addSkill);
router.delete('/:vacancyId/skills/:skillId', authenticate, requireRole('EMPLOYER'), ctrl.removeSkill);

export default router;
