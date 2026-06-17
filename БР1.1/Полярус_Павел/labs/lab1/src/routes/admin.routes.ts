import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/requireRole';
import { validate } from '../middleware/validate';
import { UserRole } from '../entities/User';
import { CreateNameDto, UpdateNameDto, CreateCityDto, UpdateCityDto } from '../dto/DictionaryDto';
import * as ctrl from '../controllers/dictionary.controller';

const router = Router();

router.use(authenticate, requireRole(UserRole.ADMIN));

router.post('/dictionaries/countries', validate(CreateNameDto), ctrl.createCountry);
router.patch('/dictionaries/countries/:id', validate(UpdateNameDto), ctrl.updateCountry);
router.delete('/dictionaries/countries/:id', ctrl.deleteCountry);

router.post('/dictionaries/cities', validate(CreateCityDto), ctrl.createCity);
router.patch('/dictionaries/cities/:id', validate(UpdateCityDto), ctrl.updateCity);
router.delete('/dictionaries/cities/:id', ctrl.deleteCity);

router.post('/dictionaries/industries', validate(CreateNameDto), ctrl.createIndustry);
router.patch('/dictionaries/industries/:id', validate(UpdateNameDto), ctrl.updateIndustry);
router.delete('/dictionaries/industries/:id', ctrl.deleteIndustry);

router.post('/dictionaries/skills', validate(CreateNameDto), ctrl.createSkill);
router.patch('/dictionaries/skills/:id', validate(UpdateNameDto), ctrl.updateSkill);
router.delete('/dictionaries/skills/:id', ctrl.deleteSkill);

router.post('/dictionaries/employment-types', validate(CreateNameDto), ctrl.createEmploymentType);
router.patch('/dictionaries/employment-types/:id', validate(UpdateNameDto), ctrl.updateEmploymentType);
router.delete('/dictionaries/employment-types/:id', ctrl.deleteEmploymentType);

router.post('/dictionaries/degree-types', validate(CreateNameDto), ctrl.createDegreeType);
router.patch('/dictionaries/degree-types/:id', validate(UpdateNameDto), ctrl.updateDegreeType);
router.delete('/dictionaries/degree-types/:id', ctrl.deleteDegreeType);

export default router;
