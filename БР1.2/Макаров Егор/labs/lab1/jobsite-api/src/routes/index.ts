import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { authenticate, requireRole } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { UserRole } from '../entities/enums';
import * as schemas from '../validation/schemas';

import * as auth from '../controllers/authController';
import * as users from '../controllers/userController';
import * as seeker from '../controllers/seekerController';
import * as resume from '../controllers/resumeController';
import * as employer from '../controllers/employerController';
import * as company from '../controllers/companyController';
import * as vacancy from '../controllers/vacancyController';
import * as application from '../controllers/applicationController';
import * as saved from '../controllers/savedVacancyController';
import * as dict from '../controllers/dictionaryController';

const r = Router();
const seekerOnly = requireRole(UserRole.SEEKER);
const employerOnly = requireRole(UserRole.EMPLOYER);

// ---------- Auth ----------
r.post('/auth/register', validate(schemas.registerSchema), asyncHandler(auth.register));
r.post('/auth/login', validate(schemas.loginSchema), asyncHandler(auth.login));
r.post('/auth/refresh', validate(schemas.refreshSchema), asyncHandler(auth.refresh));

// ---------- Users ----------
r.get('/users/me', authenticate, asyncHandler(users.getMe));
r.patch('/users/me', authenticate, validate(schemas.updateUserSchema), asyncHandler(users.updateMe));
r.delete('/users/me', authenticate, asyncHandler(users.deleteMe));

// ---------- Job Seekers ----------
r.get('/seeker/profile', authenticate, seekerOnly, asyncHandler(seeker.getProfile));
r.put('/seeker/profile', authenticate, seekerOnly, validate(schemas.jobSeekerSchema), asyncHandler(seeker.updateProfile));
r.get('/seekers/:seekerId', authenticate, asyncHandler(seeker.getPublic));

// ---------- Saved vacancies (до /resumes, без коллизий) ----------
r.get('/seeker/saved-vacancies', authenticate, seekerOnly, asyncHandler(saved.listSaved));
r.post('/seeker/saved-vacancies', authenticate, seekerOnly, validate(schemas.saveVacancySchema), asyncHandler(saved.addSaved));
r.delete('/seeker/saved-vacancies/:vacancyId', authenticate, seekerOnly, asyncHandler(saved.removeSaved));

// ---------- Resumes ----------
r.get('/resumes', authenticate, seekerOnly, asyncHandler(resume.listResumes));
r.post('/resumes', authenticate, seekerOnly, validate(schemas.resumeSchema), asyncHandler(resume.createResume));
r.get('/resumes/:resumeId', authenticate, asyncHandler(resume.getResume));
r.put('/resumes/:resumeId', authenticate, seekerOnly, validate(schemas.resumeSchema), asyncHandler(resume.updateResume));
r.delete('/resumes/:resumeId', authenticate, seekerOnly, asyncHandler(resume.deleteResume));
r.put('/resumes/:resumeId/skills', authenticate, seekerOnly, validate(schemas.skillIdsSchema), asyncHandler(resume.setResumeSkills));

// ---------- Work experiences ----------
r.get('/resumes/:resumeId/work-experiences', authenticate, asyncHandler(resume.listWorkExperiences));
r.post('/resumes/:resumeId/work-experiences', authenticate, seekerOnly, validate(schemas.workExperienceSchema), asyncHandler(resume.createWorkExperience));
r.put('/work-experiences/:id', authenticate, seekerOnly, validate(schemas.workExperienceSchema), asyncHandler(resume.updateWorkExperience));
r.delete('/work-experiences/:id', authenticate, seekerOnly, asyncHandler(resume.deleteWorkExperience));

// ---------- Educations ----------
r.get('/resumes/:resumeId/educations', authenticate, asyncHandler(resume.listEducations));
r.post('/resumes/:resumeId/educations', authenticate, seekerOnly, validate(schemas.educationSchema), asyncHandler(resume.createEducation));
r.put('/educations/:id', authenticate, seekerOnly, validate(schemas.educationSchema), asyncHandler(resume.updateEducation));
r.delete('/educations/:id', authenticate, seekerOnly, asyncHandler(resume.deleteEducation));

// ---------- Dictionaries ----------
r.get('/industries', asyncHandler(dict.listIndustries));
r.get('/skills', asyncHandler(dict.listSkills));
r.post('/skills', authenticate, validate(schemas.skillSchema), asyncHandler(dict.createSkill));

// ---------- Companies ----------
r.get('/companies', asyncHandler(company.listCompanies));
r.post('/companies', authenticate, employerOnly, validate(schemas.companySchema), asyncHandler(company.createCompany));
r.get('/companies/:companyId', asyncHandler(company.getCompany));
r.put('/companies/:companyId', authenticate, employerOnly, validate(schemas.companySchema), asyncHandler(company.updateCompany));
r.delete('/companies/:companyId', authenticate, employerOnly, asyncHandler(company.deleteCompany));

// ---------- Employer profile ----------
r.get('/employer/profile', authenticate, employerOnly, asyncHandler(employer.getProfile));
r.put('/employer/profile', authenticate, employerOnly, validate(schemas.employerSchema), asyncHandler(employer.updateProfile));

// ---------- Vacancies ----------
r.get('/vacancies', asyncHandler(vacancy.listVacancies));
r.post('/vacancies', authenticate, employerOnly, validate(schemas.vacancySchema), asyncHandler(vacancy.createVacancy));
r.get('/vacancies/:vacancyId', asyncHandler(vacancy.getVacancy));
r.put('/vacancies/:vacancyId', authenticate, employerOnly, validate(schemas.vacancySchema), asyncHandler(vacancy.updateVacancy));
r.delete('/vacancies/:vacancyId', authenticate, employerOnly, asyncHandler(vacancy.deleteVacancy));

// ---------- Applications ----------
r.get('/vacancies/:vacancyId/applications', authenticate, employerOnly, asyncHandler(application.listVacancyApplications));
r.post('/vacancies/:vacancyId/applications', authenticate, seekerOnly, validate(schemas.applicationSchema), asyncHandler(application.createApplication));
r.get('/applications', authenticate, seekerOnly, asyncHandler(application.listMyApplications));
r.get('/applications/:applicationId', authenticate, asyncHandler(application.getApplication));
r.patch('/applications/:applicationId', authenticate, employerOnly, validate(schemas.applicationStatusSchema), asyncHandler(application.updateApplicationStatus));
r.delete('/applications/:applicationId', authenticate, seekerOnly, asyncHandler(application.deleteApplication));

export default r;
