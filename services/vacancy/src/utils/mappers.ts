import { Company } from "../entities/Company";
import { Vacancy } from "../entities/Vacancy";

export const toCompany = (c: Company) => ({
  id: c.id,
  name: c.name,
  description: c.description,
  website: c.website,
  industry: c.industry,
});

export const toCompanyInternal = (c: Company) => ({
  id: c.id,
  owner_id: c.ownerId,
  name: c.name,
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
