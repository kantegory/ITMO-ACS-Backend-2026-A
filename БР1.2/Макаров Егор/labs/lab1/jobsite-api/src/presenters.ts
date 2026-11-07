import { User } from './entities/User';
import { JobSeeker } from './entities/JobSeeker';
import { Employer } from './entities/Employer';
import { Company } from './entities/Company';
import { Industry } from './entities/Industry';
import { Skill } from './entities/Skill';
import { Resume } from './entities/Resume';
import { WorkExperience } from './entities/WorkExperience';
import { Education } from './entities/Education';
import { Vacancy } from './entities/Vacancy';
import { Application } from './entities/Application';

export const presentUser = (u: User) => ({
  id: u.id,
  email: u.email,
  role: u.role,
  created_at: u.createdAt,
  updated_at: u.updatedAt,
});

export const presentSkill = (s: Skill) => ({ id: s.id, name: s.name });
export const presentIndustry = (i: Industry) => ({ id: i.id, name: i.name });

export const presentJobSeeker = (s: JobSeeker) => ({
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

export const presentCompany = (c: Company) => ({
  id: c.id,
  name: c.name,
  description: c.description ?? null,
  logo_url: c.logoUrl ?? null,
  website: c.website ?? null,
  industry: c.industry ? presentIndustry(c.industry) : null,
  size: c.size ?? null,
  city: c.city ?? null,
  created_at: c.createdAt,
});

export const presentEmployer = (e: Employer) => ({
  id: e.id,
  user_id: e.userId,
  company: e.company ? presentCompany(e.company) : null,
  position: e.position ?? null,
  created_at: e.createdAt,
});

export const presentWorkExperience = (w: WorkExperience) => ({
  id: w.id,
  resume_id: w.resumeId,
  company_name: w.companyName,
  position: w.position,
  start_date: w.startDate,
  end_date: w.endDate ?? null,
  is_current: w.isCurrent,
  description: w.description ?? null,
});

export const presentEducation = (e: Education) => ({
  id: e.id,
  resume_id: e.resumeId,
  institution: e.institution,
  degree: e.degree ?? null,
  field_of_study: e.fieldOfStudy ?? null,
  start_year: e.startYear,
  end_year: e.endYear ?? null,
});

export const presentResume = (r: Resume) => ({
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

export const presentResumeDetail = (r: Resume) => ({
  ...presentResume(r),
  skills: (r.skills ?? []).map(presentSkill),
  work_experiences: (r.workExperiences ?? []).map(presentWorkExperience),
  educations: (r.educations ?? []).map(presentEducation),
});

export const presentVacancy = (v: Vacancy) => ({
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

export const presentVacancyDetail = (v: Vacancy) => ({
  ...presentVacancy(v),
  description: v.description ?? null,
  requirements: v.requirements ?? null,
  company: v.company ? presentCompany(v.company) : null,
  skills: (v.skills ?? []).map(presentSkill),
});

export const presentApplication = (a: Application) => ({
  id: a.id,
  vacancy_id: a.vacancyId,
  resume_id: a.resumeId,
  cover_letter: a.coverLetter ?? null,
  status: a.status,
  created_at: a.createdAt,
  updated_at: a.updatedAt,
});

export const presentApplicationDetail = (a: Application) => ({
  ...presentApplication(a),
  vacancy: a.vacancy ? presentVacancy(a.vacancy) : null,
  resume: a.resume ? presentResume(a.resume) : null,
});
