import { z } from 'zod';
import {
  UserRole, CompanySize, EmploymentType, Schedule, ResumeStatus, VacancyStatus, ApplicationStatus,
} from '../entities/enums';

const enumValues = <T extends Record<string, string>>(e: T) =>
  Object.values(e) as [string, ...string[]];

export const registerSchema = z
  .object({
    email: z.string().email('Некорректный формат email'),
    password: z.string().min(8, 'Минимальная длина — 8 символов'),
    role: z.enum(enumValues(UserRole)),
    first_name: z.string().min(1).max(100).optional(),
    last_name: z.string().min(1).max(100).optional(),
  })
  .refine((d) => d.role !== UserRole.SEEKER || (d.first_name && d.last_name), {
    message: 'Для роли seeker обязательны first_name и last_name',
    path: ['first_name'],
  });

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const refreshSchema = z.object({
  refresh_token: z.string().min(1),
});

export const updateUserSchema = z.object({
  email: z.string().email().optional(),
  current_password: z.string().optional(),
  new_password: z.string().min(8).optional(),
});

export const jobSeekerSchema = z.object({
  first_name: z.string().min(1).max(100),
  last_name: z.string().min(1).max(100),
  phone: z.string().max(20).nullish(),
  city: z.string().max(100).nullish(),
  avatar_url: z.string().url().nullish(),
  about: z.string().nullish(),
});

export const employerSchema = z.object({
  company_id: z.number().int().positive().optional(),
  position: z.string().max(255).nullish(),
});

export const resumeSchema = z.object({
  title: z.string().min(1).max(255),
  salary_expected: z.number().int().min(0).nullish(),
  currency: z.string().max(10).optional(),
  employment_type: z.enum(enumValues(EmploymentType)).nullish(),
  schedule: z.enum(enumValues(Schedule)).nullish(),
  status: z.enum(enumValues(ResumeStatus)).optional(),
  skill_ids: z.array(z.number().int().positive()).optional(),
});

export const skillIdsSchema = z.object({
  skill_ids: z.array(z.number().int().positive()),
});

export const workExperienceSchema = z.object({
  company_name: z.string().min(1).max(255),
  position: z.string().min(1).max(255),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ожидается формат YYYY-MM-DD'),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullish(),
  is_current: z.boolean().optional(),
  description: z.string().nullish(),
});

export const educationSchema = z.object({
  institution: z.string().min(1).max(255),
  degree: z.string().max(100).nullish(),
  field_of_study: z.string().max(255).nullish(),
  start_year: z.number().int(),
  end_year: z.number().int().nullish(),
});

export const skillSchema = z.object({
  name: z.string().min(1).max(100),
});

export const companySchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().nullish(),
  logo_url: z.string().url().nullish(),
  website: z.string().max(255).nullish(),
  industry_id: z.number().int().positive().nullish(),
  size: z.enum(enumValues(CompanySize)).nullish(),
  city: z.string().max(100).nullish(),
});

export const vacancySchema = z.object({
  company_id: z.number().int().positive(),
  title: z.string().min(1).max(255),
  description: z.string().nullish(),
  requirements: z.string().nullish(),
  salary_from: z.number().int().min(0).nullish(),
  salary_to: z.number().int().min(0).nullish(),
  currency: z.string().max(10).optional(),
  experience_years: z.number().int().min(0).nullish(),
  employment_type: z.enum(enumValues(EmploymentType)).nullish(),
  schedule: z.enum(enumValues(Schedule)).nullish(),
  city: z.string().max(100).nullish(),
  status: z.enum(enumValues(VacancyStatus)).optional(),
  skill_ids: z.array(z.number().int().positive()).optional(),
});

export const applicationSchema = z.object({
  resume_id: z.number().int().positive(),
  cover_letter: z.string().nullish(),
});

export const applicationStatusSchema = z.object({
  status: z.enum(enumValues(ApplicationStatus)),
});

export const saveVacancySchema = z.object({
  vacancy_id: z.number().int().positive(),
});
