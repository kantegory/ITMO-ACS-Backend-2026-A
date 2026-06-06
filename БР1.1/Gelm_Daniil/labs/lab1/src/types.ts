export type UserRole = "applicant" | "employer" | "admin";

export type EmploymentType = "full_time" | "part_time" | "contract" | "internship";

export type ApplicationStatus = "sent" | "viewed" | "accepted" | "rejected";

export interface User {
  id: number;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface Company {
  id: number;
  ownerId: number;
  name: string;
  description: string | null;
  website: string | null;
  location: string | null;
  createdAt: Date;
}

export interface Resume {
  id: number;
  userId: number;
  title: string;
  about: string | null;
  experienceYears: number;
  education: string | null;
  desiredSalary: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Skill {
  id: number;
  name: string;
}

export interface ResumeSkill {
  resumeId: number;
  skillId: number;
}

export interface Vacancy {
  id: number;
  companyId: number;
  title: string;
  description: string | null;
  salaryFrom: number | null;
  salaryTo: number | null;
  experienceRequired: number | null;
  employmentType: EmploymentType;
  location: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface VacancySkill {
  vacancyId: number;
  skillId: number;
}

export interface Application {
  id: number;
  vacancyId: number;
  resumeId: number;
  status: ApplicationStatus;
  coverLetter: string | null;
  createdAt: Date;
}

export interface FavoriteVacancy {
  userId: number;
  vacancyId: number;
  createdAt: Date;
}
