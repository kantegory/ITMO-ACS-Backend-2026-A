"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toVacancy = exports.toCompanyInternal = exports.toCompany = void 0;
const toCompany = (c) => ({
    id: c.id,
    name: c.name,
    description: c.description,
    website: c.website,
    industry: c.industry,
});
exports.toCompany = toCompany;
const toCompanyInternal = (c) => ({
    id: c.id,
    owner_id: c.ownerId,
    name: c.name,
    industry: c.industry,
});
exports.toCompanyInternal = toCompanyInternal;
const toVacancy = (v) => ({
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
exports.toVacancy = toVacancy;
