import { User } from "../entities/User";
import { CandidateProfile } from "../entities/CandidateProfile";
import { Resume } from "../entities/Resume";
import { Company } from "../entities/Company";
import { Vacancy } from "../entities/Vacancy";

export const toUser = (u: User) => ({
  id: u.id,
  email: u.email,
  role: u.role,
  full_name: u.fullName,
  created_at: u.createdAt,
});

export const toProfile = (p: CandidateProfile) => ({
  id: p.id,
  user_id: p.userId,
  city: p.city,
  phone: p.phone,
  about: p.about,
  updated_at: p.updatedAt,
});

export const toResume = (r: Resume) => ({
  id: r.id,
  title: r.title,
  summary: r.summary,
  experience_level: r.experienceLevel,
  skills: r.skills,
  updated_at: r.updatedAt,
});

export const toCompany = (c: Company) => ({
  id: c.id,
  name: c.name,
  description: c.description,
  website: c.website,
  industry: c.industry,
});

export const toVacancy = (v: Vacancy) => ({
  id: v.id,
  company_id: v.companyId,
  title: v.title,
  description: v.description,
  requirements: v.requirements,
  industry: v.industry,
  salary_from: v.salaryFrom,
  salary_to: v.salaryTo,
  experience_level: v.experienceLevel,
  location: v.location,
  employment_type: v.employmentType,
  status: v.status,
  created_at: v.createdAt,
  updated_at: v.updatedAt,
});
