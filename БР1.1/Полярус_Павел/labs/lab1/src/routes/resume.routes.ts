import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/requireRole';
import { validate } from '../middleware/validate';
import { UserRole } from '../entities/User';
import {
  CreateResumeDto,
  UpdateResumeDto,
  AddResumeSkillDto,
  CreateWorkExperienceDto,
  UpdateWorkExperienceDto,
  CreateEducationDto,
  UpdateEducationDto,
} from '../dto/ResumeDto';
import * as ctrl from '../controllers/resume.controller';

const router = Router();

router.use(authenticate);

router.get('/', requireRole(UserRole.SEEKER), ctrl.getMyResumes);
router.post('/', requireRole(UserRole.SEEKER), validate(CreateResumeDto), ctrl.createResume);

router.get('/:resumeId', requireRole(UserRole.SEEKER, UserRole.EMPLOYER), ctrl.getResume);
router.patch('/:resumeId', requireRole(UserRole.SEEKER), validate(UpdateResumeDto), ctrl.updateResume);
router.delete('/:resumeId', requireRole(UserRole.SEEKER), ctrl.deleteResume);

router.post('/:resumeId/skills', requireRole(UserRole.SEEKER), validate(AddResumeSkillDto), ctrl.addSkill);
router.delete('/:resumeId/skills/:skillId', requireRole(UserRole.SEEKER), ctrl.removeSkill);

router.post('/:resumeId/work-experience', requireRole(UserRole.SEEKER), validate(CreateWorkExperienceDto), ctrl.addWorkExperience);
router.patch('/:resumeId/work-experience/:workId', requireRole(UserRole.SEEKER), validate(UpdateWorkExperienceDto), ctrl.updateWorkExperience);
router.delete('/:resumeId/work-experience/:workId', requireRole(UserRole.SEEKER), ctrl.deleteWorkExperience);

router.post('/:resumeId/education', requireRole(UserRole.SEEKER), validate(CreateEducationDto), ctrl.addEducation);
router.patch('/:resumeId/education/:educationId', requireRole(UserRole.SEEKER), validate(UpdateEducationDto), ctrl.updateEducation);
router.delete('/:resumeId/education/:educationId', requireRole(UserRole.SEEKER), ctrl.deleteEducation);

export default router;
