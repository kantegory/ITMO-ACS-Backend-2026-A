"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveVacancySchema = exports.applicationStatusSchema = exports.applicationSchema = exports.vacancySchema = exports.companySchema = exports.skillSchema = exports.educationSchema = exports.workExperienceSchema = exports.skillIdsSchema = exports.resumeSchema = exports.employerSchema = exports.jobSeekerSchema = exports.updateUserSchema = exports.refreshSchema = exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
const enums_1 = require("../entities/enums");
const enumValues = (e) => Object.values(e);
exports.registerSchema = zod_1.z
    .object({
    email: zod_1.z.string().email('Некорректный формат email'),
    password: zod_1.z.string().min(8, 'Минимальная длина — 8 символов'),
    role: zod_1.z.enum(enumValues(enums_1.UserRole)),
    first_name: zod_1.z.string().min(1).max(100).optional(),
    last_name: zod_1.z.string().min(1).max(100).optional(),
})
    .refine((d) => d.role !== enums_1.UserRole.SEEKER || (d.first_name && d.last_name), {
    message: 'Для роли seeker обязательны first_name и last_name',
    path: ['first_name'],
});
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(1),
});
exports.refreshSchema = zod_1.z.object({
    refresh_token: zod_1.z.string().min(1),
});
exports.updateUserSchema = zod_1.z.object({
    email: zod_1.z.string().email().optional(),
    current_password: zod_1.z.string().optional(),
    new_password: zod_1.z.string().min(8).optional(),
});
exports.jobSeekerSchema = zod_1.z.object({
    first_name: zod_1.z.string().min(1).max(100),
    last_name: zod_1.z.string().min(1).max(100),
    phone: zod_1.z.string().max(20).nullish(),
    city: zod_1.z.string().max(100).nullish(),
    avatar_url: zod_1.z.string().url().nullish(),
    about: zod_1.z.string().nullish(),
});
exports.employerSchema = zod_1.z.object({
    company_id: zod_1.z.number().int().positive().optional(),
    position: zod_1.z.string().max(255).nullish(),
});
exports.resumeSchema = zod_1.z.object({
    title: zod_1.z.string().min(1).max(255),
    salary_expected: zod_1.z.number().int().min(0).nullish(),
    currency: zod_1.z.string().max(10).optional(),
    employment_type: zod_1.z.enum(enumValues(enums_1.EmploymentType)).nullish(),
    schedule: zod_1.z.enum(enumValues(enums_1.Schedule)).nullish(),
    status: zod_1.z.enum(enumValues(enums_1.ResumeStatus)).optional(),
    skill_ids: zod_1.z.array(zod_1.z.number().int().positive()).optional(),
});
exports.skillIdsSchema = zod_1.z.object({
    skill_ids: zod_1.z.array(zod_1.z.number().int().positive()),
});
exports.workExperienceSchema = zod_1.z.object({
    company_name: zod_1.z.string().min(1).max(255),
    position: zod_1.z.string().min(1).max(255),
    start_date: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ожидается формат YYYY-MM-DD'),
    end_date: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullish(),
    is_current: zod_1.z.boolean().optional(),
    description: zod_1.z.string().nullish(),
});
exports.educationSchema = zod_1.z.object({
    institution: zod_1.z.string().min(1).max(255),
    degree: zod_1.z.string().max(100).nullish(),
    field_of_study: zod_1.z.string().max(255).nullish(),
    start_year: zod_1.z.number().int(),
    end_year: zod_1.z.number().int().nullish(),
});
exports.skillSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100),
});
exports.companySchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(255),
    description: zod_1.z.string().nullish(),
    logo_url: zod_1.z.string().url().nullish(),
    website: zod_1.z.string().max(255).nullish(),
    industry_id: zod_1.z.number().int().positive().nullish(),
    size: zod_1.z.enum(enumValues(enums_1.CompanySize)).nullish(),
    city: zod_1.z.string().max(100).nullish(),
});
exports.vacancySchema = zod_1.z.object({
    company_id: zod_1.z.number().int().positive(),
    title: zod_1.z.string().min(1).max(255),
    description: zod_1.z.string().nullish(),
    requirements: zod_1.z.string().nullish(),
    salary_from: zod_1.z.number().int().min(0).nullish(),
    salary_to: zod_1.z.number().int().min(0).nullish(),
    currency: zod_1.z.string().max(10).optional(),
    experience_years: zod_1.z.number().int().min(0).nullish(),
    employment_type: zod_1.z.enum(enumValues(enums_1.EmploymentType)).nullish(),
    schedule: zod_1.z.enum(enumValues(enums_1.Schedule)).nullish(),
    city: zod_1.z.string().max(100).nullish(),
    status: zod_1.z.enum(enumValues(enums_1.VacancyStatus)).optional(),
    skill_ids: zod_1.z.array(zod_1.z.number().int().positive()).optional(),
});
exports.applicationSchema = zod_1.z.object({
    resume_id: zod_1.z.number().int().positive(),
    cover_letter: zod_1.z.string().nullish(),
});
exports.applicationStatusSchema = zod_1.z.object({
    status: zod_1.z.enum(enumValues(enums_1.ApplicationStatus)),
});
exports.saveVacancySchema = zod_1.z.object({
    vacancy_id: zod_1.z.number().int().positive(),
});
//# sourceMappingURL=schemas.js.map