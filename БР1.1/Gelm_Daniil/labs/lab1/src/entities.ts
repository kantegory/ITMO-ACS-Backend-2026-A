import { EntitySchema } from "typeorm";
import type {
  Application,
  Company,
  FavoriteVacancy,
  Resume,
  ResumeSkill,
  Skill,
  User,
  Vacancy,
  VacancySkill,
} from "./types";

export const UserEntity = new EntitySchema<User>({
  name: "User",
  tableName: "users",
  columns: {
    id: { type: Number, primary: true, generated: true },
    email: { type: String, unique: true },
    passwordHash: { type: String, name: "password_hash" },
    firstName: { type: String, name: "first_name" },
    lastName: { type: String, name: "last_name" },
    role: { type: String },
    createdAt: { type: "timestamp", name: "created_at", createDate: true },
    updatedAt: { type: "timestamp", name: "updated_at", updateDate: true },
  },
});

export const CompanyEntity = new EntitySchema<Company>({
  name: "Company",
  tableName: "companies",
  columns: {
    id: { type: Number, primary: true, generated: true },
    ownerId: { type: Number, name: "owner_id" },
    name: { type: String },
    description: { type: String, nullable: true },
    website: { type: String, nullable: true },
    location: { type: String, nullable: true },
    createdAt: { type: "timestamp", name: "created_at", createDate: true },
  },
});

export const ResumeEntity = new EntitySchema<Resume>({
  name: "Resume",
  tableName: "resumes",
  columns: {
    id: { type: Number, primary: true, generated: true },
    userId: { type: Number, name: "user_id" },
    title: { type: String },
    about: { type: String, nullable: true },
    experienceYears: { type: Number, name: "experience_years", default: 0 },
    education: { type: String, nullable: true },
    desiredSalary: { type: Number, name: "desired_salary", nullable: true },
    createdAt: { type: "timestamp", name: "created_at", createDate: true },
    updatedAt: { type: "timestamp", name: "updated_at", updateDate: true },
  },
});

export const SkillEntity = new EntitySchema<Skill>({
  name: "Skill",
  tableName: "skills",
  columns: {
    id: { type: Number, primary: true, generated: true },
    name: { type: String, unique: true },
  },
});

export const ResumeSkillEntity = new EntitySchema<ResumeSkill>({
  name: "ResumeSkill",
  tableName: "resume_skills",
  columns: {
    resumeId: { type: Number, name: "resume_id", primary: true },
    skillId: { type: Number, name: "skill_id", primary: true },
  },
});

export const VacancyEntity = new EntitySchema<Vacancy>({
  name: "Vacancy",
  tableName: "vacancies",
  columns: {
    id: { type: Number, primary: true, generated: true },
    companyId: { type: Number, name: "company_id" },
    title: { type: String },
    description: { type: String, nullable: true },
    salaryFrom: { type: Number, name: "salary_from", nullable: true },
    salaryTo: { type: Number, name: "salary_to", nullable: true },
    experienceRequired: { type: Number, name: "experience_required", nullable: true },
    employmentType: { type: String, name: "employment_type", default: "full_time" },
    location: { type: String, nullable: true },
    createdAt: { type: "timestamp", name: "created_at", createDate: true },
    updatedAt: { type: "timestamp", name: "updated_at", updateDate: true },
  },
});

export const VacancySkillEntity = new EntitySchema<VacancySkill>({
  name: "VacancySkill",
  tableName: "vacancy_skills",
  columns: {
    vacancyId: { type: Number, name: "vacancy_id", primary: true },
    skillId: { type: Number, name: "skill_id", primary: true },
  },
});

export const ApplicationEntity = new EntitySchema<Application>({
  name: "Application",
  tableName: "applications",
  columns: {
    id: { type: Number, primary: true, generated: true },
    vacancyId: { type: Number, name: "vacancy_id" },
    resumeId: { type: Number, name: "resume_id" },
    status: { type: String, default: "sent" },
    coverLetter: { type: String, name: "cover_letter", nullable: true },
    createdAt: { type: "timestamp", name: "created_at", createDate: true },
  },
});

export const FavoriteVacancyEntity = new EntitySchema<FavoriteVacancy>({
  name: "FavoriteVacancy",
  tableName: "favorite_vacancies",
  columns: {
    userId: { type: Number, name: "user_id", primary: true },
    vacancyId: { type: Number, name: "vacancy_id", primary: true },
    createdAt: { type: "timestamp", name: "created_at", createDate: true },
  },
});
