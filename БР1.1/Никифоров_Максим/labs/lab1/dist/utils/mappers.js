"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toVacancy = exports.toCompany = exports.toResume = exports.toProfile = exports.toUser = void 0;
const toUser = (u) => ({
    id: u.id,
    email: u.email,
    role: u.role,
    full_name: u.fullName,
    created_at: u.createdAt,
});
exports.toUser = toUser;
const toProfile = (p) => ({
    id: p.id,
    user_id: p.userId,
    city: p.city,
    phone: p.phone,
    about: p.about,
    updated_at: p.updatedAt,
});
exports.toProfile = toProfile;
const toResume = (r) => ({
    id: r.id,
    title: r.title,
    summary: r.summary,
    experience_level: r.experienceLevel,
    skills: r.skills,
    updated_at: r.updatedAt,
});
exports.toResume = toResume;
const toCompany = (c) => ({
    id: c.id,
    name: c.name,
    description: c.description,
    website: c.website,
    industry: c.industry,
});
exports.toCompany = toCompany;
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
