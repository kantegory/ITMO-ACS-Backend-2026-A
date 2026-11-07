"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const asyncHandler_1 = require("../utils/asyncHandler");
const auth_1 = require("../middlewares/auth");
const validate_1 = require("../middlewares/validate");
const enums_1 = require("../entities/enums");
const schemas = __importStar(require("../validation/schemas"));
const auth = __importStar(require("../controllers/authController"));
const users = __importStar(require("../controllers/userController"));
const seeker = __importStar(require("../controllers/seekerController"));
const resume = __importStar(require("../controllers/resumeController"));
const employer = __importStar(require("../controllers/employerController"));
const company = __importStar(require("../controllers/companyController"));
const vacancy = __importStar(require("../controllers/vacancyController"));
const application = __importStar(require("../controllers/applicationController"));
const saved = __importStar(require("../controllers/savedVacancyController"));
const dict = __importStar(require("../controllers/dictionaryController"));
const r = (0, express_1.Router)();
const seekerOnly = (0, auth_1.requireRole)(enums_1.UserRole.SEEKER);
const employerOnly = (0, auth_1.requireRole)(enums_1.UserRole.EMPLOYER);
// ---------- Auth ----------
r.post('/auth/register', (0, validate_1.validate)(schemas.registerSchema), (0, asyncHandler_1.asyncHandler)(auth.register));
r.post('/auth/login', (0, validate_1.validate)(schemas.loginSchema), (0, asyncHandler_1.asyncHandler)(auth.login));
r.post('/auth/refresh', (0, validate_1.validate)(schemas.refreshSchema), (0, asyncHandler_1.asyncHandler)(auth.refresh));
// ---------- Users ----------
r.get('/users/me', auth_1.authenticate, (0, asyncHandler_1.asyncHandler)(users.getMe));
r.patch('/users/me', auth_1.authenticate, (0, validate_1.validate)(schemas.updateUserSchema), (0, asyncHandler_1.asyncHandler)(users.updateMe));
r.delete('/users/me', auth_1.authenticate, (0, asyncHandler_1.asyncHandler)(users.deleteMe));
// ---------- Job Seekers ----------
r.get('/seeker/profile', auth_1.authenticate, seekerOnly, (0, asyncHandler_1.asyncHandler)(seeker.getProfile));
r.put('/seeker/profile', auth_1.authenticate, seekerOnly, (0, validate_1.validate)(schemas.jobSeekerSchema), (0, asyncHandler_1.asyncHandler)(seeker.updateProfile));
r.get('/seekers/:seekerId', auth_1.authenticate, (0, asyncHandler_1.asyncHandler)(seeker.getPublic));
// ---------- Saved vacancies (до /resumes, без коллизий) ----------
r.get('/seeker/saved-vacancies', auth_1.authenticate, seekerOnly, (0, asyncHandler_1.asyncHandler)(saved.listSaved));
r.post('/seeker/saved-vacancies', auth_1.authenticate, seekerOnly, (0, validate_1.validate)(schemas.saveVacancySchema), (0, asyncHandler_1.asyncHandler)(saved.addSaved));
r.delete('/seeker/saved-vacancies/:vacancyId', auth_1.authenticate, seekerOnly, (0, asyncHandler_1.asyncHandler)(saved.removeSaved));
// ---------- Resumes ----------
r.get('/resumes', auth_1.authenticate, seekerOnly, (0, asyncHandler_1.asyncHandler)(resume.listResumes));
r.post('/resumes', auth_1.authenticate, seekerOnly, (0, validate_1.validate)(schemas.resumeSchema), (0, asyncHandler_1.asyncHandler)(resume.createResume));
r.get('/resumes/:resumeId', auth_1.authenticate, (0, asyncHandler_1.asyncHandler)(resume.getResume));
r.put('/resumes/:resumeId', auth_1.authenticate, seekerOnly, (0, validate_1.validate)(schemas.resumeSchema), (0, asyncHandler_1.asyncHandler)(resume.updateResume));
r.delete('/resumes/:resumeId', auth_1.authenticate, seekerOnly, (0, asyncHandler_1.asyncHandler)(resume.deleteResume));
r.put('/resumes/:resumeId/skills', auth_1.authenticate, seekerOnly, (0, validate_1.validate)(schemas.skillIdsSchema), (0, asyncHandler_1.asyncHandler)(resume.setResumeSkills));
// ---------- Work experiences ----------
r.get('/resumes/:resumeId/work-experiences', auth_1.authenticate, (0, asyncHandler_1.asyncHandler)(resume.listWorkExperiences));
r.post('/resumes/:resumeId/work-experiences', auth_1.authenticate, seekerOnly, (0, validate_1.validate)(schemas.workExperienceSchema), (0, asyncHandler_1.asyncHandler)(resume.createWorkExperience));
r.put('/work-experiences/:id', auth_1.authenticate, seekerOnly, (0, validate_1.validate)(schemas.workExperienceSchema), (0, asyncHandler_1.asyncHandler)(resume.updateWorkExperience));
r.delete('/work-experiences/:id', auth_1.authenticate, seekerOnly, (0, asyncHandler_1.asyncHandler)(resume.deleteWorkExperience));
// ---------- Educations ----------
r.get('/resumes/:resumeId/educations', auth_1.authenticate, (0, asyncHandler_1.asyncHandler)(resume.listEducations));
r.post('/resumes/:resumeId/educations', auth_1.authenticate, seekerOnly, (0, validate_1.validate)(schemas.educationSchema), (0, asyncHandler_1.asyncHandler)(resume.createEducation));
r.put('/educations/:id', auth_1.authenticate, seekerOnly, (0, validate_1.validate)(schemas.educationSchema), (0, asyncHandler_1.asyncHandler)(resume.updateEducation));
r.delete('/educations/:id', auth_1.authenticate, seekerOnly, (0, asyncHandler_1.asyncHandler)(resume.deleteEducation));
// ---------- Dictionaries ----------
r.get('/industries', (0, asyncHandler_1.asyncHandler)(dict.listIndustries));
r.get('/skills', (0, asyncHandler_1.asyncHandler)(dict.listSkills));
r.post('/skills', auth_1.authenticate, (0, validate_1.validate)(schemas.skillSchema), (0, asyncHandler_1.asyncHandler)(dict.createSkill));
// ---------- Companies ----------
r.get('/companies', (0, asyncHandler_1.asyncHandler)(company.listCompanies));
r.post('/companies', auth_1.authenticate, employerOnly, (0, validate_1.validate)(schemas.companySchema), (0, asyncHandler_1.asyncHandler)(company.createCompany));
r.get('/companies/:companyId', (0, asyncHandler_1.asyncHandler)(company.getCompany));
r.put('/companies/:companyId', auth_1.authenticate, employerOnly, (0, validate_1.validate)(schemas.companySchema), (0, asyncHandler_1.asyncHandler)(company.updateCompany));
r.delete('/companies/:companyId', auth_1.authenticate, employerOnly, (0, asyncHandler_1.asyncHandler)(company.deleteCompany));
// ---------- Employer profile ----------
r.get('/employer/profile', auth_1.authenticate, employerOnly, (0, asyncHandler_1.asyncHandler)(employer.getProfile));
r.put('/employer/profile', auth_1.authenticate, employerOnly, (0, validate_1.validate)(schemas.employerSchema), (0, asyncHandler_1.asyncHandler)(employer.updateProfile));
// ---------- Vacancies ----------
r.get('/vacancies', (0, asyncHandler_1.asyncHandler)(vacancy.listVacancies));
r.post('/vacancies', auth_1.authenticate, employerOnly, (0, validate_1.validate)(schemas.vacancySchema), (0, asyncHandler_1.asyncHandler)(vacancy.createVacancy));
r.get('/vacancies/:vacancyId', (0, asyncHandler_1.asyncHandler)(vacancy.getVacancy));
r.put('/vacancies/:vacancyId', auth_1.authenticate, employerOnly, (0, validate_1.validate)(schemas.vacancySchema), (0, asyncHandler_1.asyncHandler)(vacancy.updateVacancy));
r.delete('/vacancies/:vacancyId', auth_1.authenticate, employerOnly, (0, asyncHandler_1.asyncHandler)(vacancy.deleteVacancy));
// ---------- Applications ----------
r.get('/vacancies/:vacancyId/applications', auth_1.authenticate, employerOnly, (0, asyncHandler_1.asyncHandler)(application.listVacancyApplications));
r.post('/vacancies/:vacancyId/applications', auth_1.authenticate, seekerOnly, (0, validate_1.validate)(schemas.applicationSchema), (0, asyncHandler_1.asyncHandler)(application.createApplication));
r.get('/applications', auth_1.authenticate, seekerOnly, (0, asyncHandler_1.asyncHandler)(application.listMyApplications));
r.get('/applications/:applicationId', auth_1.authenticate, (0, asyncHandler_1.asyncHandler)(application.getApplication));
r.patch('/applications/:applicationId', auth_1.authenticate, employerOnly, (0, validate_1.validate)(schemas.applicationStatusSchema), (0, asyncHandler_1.asyncHandler)(application.updateApplicationStatus));
r.delete('/applications/:applicationId', auth_1.authenticate, seekerOnly, (0, asyncHandler_1.asyncHandler)(application.deleteApplication));
exports.default = r;
//# sourceMappingURL=index.js.map