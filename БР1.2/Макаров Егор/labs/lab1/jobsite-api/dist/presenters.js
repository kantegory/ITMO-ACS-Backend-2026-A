"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.presentApplicationDetail = exports.presentApplication = exports.presentVacancyDetail = exports.presentVacancy = exports.presentResumeDetail = exports.presentResume = exports.presentEducation = exports.presentWorkExperience = exports.presentEmployer = exports.presentCompany = exports.presentJobSeeker = exports.presentIndustry = exports.presentSkill = exports.presentUser = void 0;
const presentUser = (u) => ({
    id: u.id,
    email: u.email,
    role: u.role,
    created_at: u.createdAt,
    updated_at: u.updatedAt,
});
exports.presentUser = presentUser;
const presentSkill = (s) => ({ id: s.id, name: s.name });
exports.presentSkill = presentSkill;
const presentIndustry = (i) => ({ id: i.id, name: i.name });
exports.presentIndustry = presentIndustry;
const presentJobSeeker = (s) => ({
    id: s.id,
    user_id: s.userId,
    first_name: s.firstName,
    last_name: s.lastName,
    phone: s.phone ?? null,
    city: s.city ?? null,
    avatar_url: s.avatarUrl ?? null,
    about: s.about ?? null,
    created_at: s.createdAt,
});
exports.presentJobSeeker = presentJobSeeker;
const presentCompany = (c) => ({
    id: c.id,
    name: c.name,
    description: c.description ?? null,
    logo_url: c.logoUrl ?? null,
    website: c.website ?? null,
    industry: c.industry ? (0, exports.presentIndustry)(c.industry) : null,
    size: c.size ?? null,
    city: c.city ?? null,
    created_at: c.createdAt,
});
exports.presentCompany = presentCompany;
const presentEmployer = (e) => ({
    id: e.id,
    user_id: e.userId,
    company: e.company ? (0, exports.presentCompany)(e.company) : null,
    position: e.position ?? null,
    created_at: e.createdAt,
});
exports.presentEmployer = presentEmployer;
const presentWorkExperience = (w) => ({
    id: w.id,
    resume_id: w.resumeId,
    company_name: w.companyName,
    position: w.position,
    start_date: w.startDate,
    end_date: w.endDate ?? null,
    is_current: w.isCurrent,
    description: w.description ?? null,
});
exports.presentWorkExperience = presentWorkExperience;
const presentEducation = (e) => ({
    id: e.id,
    resume_id: e.resumeId,
    institution: e.institution,
    degree: e.degree ?? null,
    field_of_study: e.fieldOfStudy ?? null,
    start_year: e.startYear,
    end_year: e.endYear ?? null,
});
exports.presentEducation = presentEducation;
const presentResume = (r) => ({
    id: r.id,
    job_seeker_id: r.jobSeekerId,
    title: r.title,
    salary_expected: r.salaryExpected ?? null,
    currency: r.currency,
    employment_type: r.employmentType ?? null,
    schedule: r.schedule ?? null,
    status: r.status,
    created_at: r.createdAt,
    updated_at: r.updatedAt,
});
exports.presentResume = presentResume;
const presentResumeDetail = (r) => ({
    ...(0, exports.presentResume)(r),
    skills: (r.skills ?? []).map(exports.presentSkill),
    work_experiences: (r.workExperiences ?? []).map(exports.presentWorkExperience),
    educations: (r.educations ?? []).map(exports.presentEducation),
});
exports.presentResumeDetail = presentResumeDetail;
const presentVacancy = (v) => ({
    id: v.id,
    company_id: v.companyId,
    employer_id: v.employerId ?? null,
    title: v.title,
    salary_from: v.salaryFrom ?? null,
    salary_to: v.salaryTo ?? null,
    currency: v.currency,
    experience_years: v.experienceYears ?? null,
    employment_type: v.employmentType ?? null,
    schedule: v.schedule ?? null,
    city: v.city ?? null,
    status: v.status,
    created_at: v.createdAt,
    updated_at: v.updatedAt,
});
exports.presentVacancy = presentVacancy;
const presentVacancyDetail = (v) => ({
    ...(0, exports.presentVacancy)(v),
    description: v.description ?? null,
    requirements: v.requirements ?? null,
    company: v.company ? (0, exports.presentCompany)(v.company) : null,
    skills: (v.skills ?? []).map(exports.presentSkill),
});
exports.presentVacancyDetail = presentVacancyDetail;
const presentApplication = (a) => ({
    id: a.id,
    vacancy_id: a.vacancyId,
    resume_id: a.resumeId,
    cover_letter: a.coverLetter ?? null,
    status: a.status,
    created_at: a.createdAt,
    updated_at: a.updatedAt,
});
exports.presentApplication = presentApplication;
const presentApplicationDetail = (a) => ({
    ...(0, exports.presentApplication)(a),
    vacancy: a.vacancy ? (0, exports.presentVacancy)(a.vacancy) : null,
    resume: a.resume ? (0, exports.presentResume)(a.resume) : null,
});
exports.presentApplicationDetail = presentApplicationDetail;
//# sourceMappingURL=presenters.js.map