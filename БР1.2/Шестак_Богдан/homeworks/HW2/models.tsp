import "@typespec/http";
import "@typespec/openapi3";

using TypeSpec.Http;

@service(#{title: "Job Search API"})
@server("https://api.jobsearch.ru/v1", "Production")
namespace JobSearchAPI;

// ── Enums ──────────────────────────────────────────────

enum UserRole {
  applicant,
  employer,
}

enum SkillLevel {
  beginner,
  middle,
  expert,
}

enum ExperienceLevel {
  no_exp,
  one_to_three,
  three_to_six,
  six_plus,
}

enum EmploymentType {
  full_time,
  part_time,
  contract,
  internship,
}

enum ApplicationStatus {
  `new`,
  viewed,
  invited,
  rejected,
}

// ── Error ──────────────────────────────────────────────

model ApiError {
  code: string;
  message: string;
  details?: Record<string>;
}

// ── Pagination ─────────────────────────────────────────

model Pagination {
  total: int32;
  page: int32;
  per_page: int32;
  pages: int32;
}

// ── Tokens ─────────────────────────────────────────────

model TokenPair {
  access_token: string;
  refresh_token: string;
  expires_in: int32;
}

// ── User ───────────────────────────────────────────────

model UserShort {
  id: int32;
  email: string;
  role: UserRole;
}

model UserProfile {
  ...UserShort;
  first_name?: string;
  last_name?: string;
  phone?: string;
  avatar_url?: url;
  created_at: utcDateTime;
}

// ── Skill ──────────────────────────────────────────────

model Skill {
  id: int32;
  name: string;
}

model ResumeSkill {
  skill: Skill;
  level: SkillLevel;
}

// ── WorkExperience ─────────────────────────────────────

model WorkExperience {
  id: int32;
  company: string;
  position: string;
  started_at: plainDate;
  ended_at?: plainDate;
  description?: string;
}

// ── Education ──────────────────────────────────────────

model Education {
  id: int32;
  institution: string;
  degree?: string;
  field?: string;
  started_at: plainDate;
  graduated_at?: plainDate;
}

// ── Resume ─────────────────────────────────────────────

model ResumeShort {
  id: int32;
  title: string;
  desired_position?: string;
  desired_salary?: int32;
  city?: string;
  is_published: boolean;
  updated_at: utcDateTime;
}

model Resume {
  ...ResumeShort;
  summary?: string;
  skills: ResumeSkill[];
  work_experience: WorkExperience[];
  education: Education[];
}

// ── Company ────────────────────────────────────────────

model Company {
  id: int32;
  name: string;
  description?: string;
  industry?: string;
  city?: string;
  website?: url;
  logo_url?: url;
  created_at: utcDateTime;
}

// ── Vacancy ────────────────────────────────────────────

model VacancyShort {
  id: int32;
  title: string;
  company_name: string;
  company_logo?: url;
  city?: string;
  salary_from?: int32;
  salary_to?: int32;
  experience: ExperienceLevel;
  employment_type: EmploymentType;
  published_at: utcDateTime;
}

model Vacancy {
  id: int32;
  company: Company;
  title: string;
  description: string;
  requirements?: string;
  industry?: string;
  salary_from?: int32;
  salary_to?: int32;
  experience: ExperienceLevel;
  employment_type: EmploymentType;
  city?: string;
  is_active: boolean;
  skills: Skill[];
  published_at: utcDateTime;
}

// ── Application ────────────────────────────────────────

model Application {
  id: int32;
  vacancy: VacancyShort;
  resume: ResumeShort;
  cover_letter?: string;
  status: ApplicationStatus;
  applied_at: utcDateTime;
}

// ── Paginated wrappers ─────────────────────────────────

model VacancyListResponse {
  items: VacancyShort[];
  pagination: Pagination;
}

model ResumeListResponse {
  items: ResumeShort[];
}

model ApplicationListResponse {
  items: Application[];
  pagination: Pagination;
}

model SkillListResponse {
  items: Skill[];
}

model VacancyMyListResponse {
  items: VacancyShort[];
  pagination: Pagination;
}
