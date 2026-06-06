import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Company } from "./Company";
import { ExperienceLevel } from "./Resume";

export type EmploymentType =
  | "full_time"
  | "part_time"
  | "contract"
  | "internship"
  | "remote";

export type VacancyStatus = "draft" | "published" | "archived";

@Entity("vacancies")
export class Vacancy {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "company_id", type: "uuid" })
  companyId!: string;

  @ManyToOne(() => Company, (c) => c.vacancies, { onDelete: "CASCADE" })
  @JoinColumn({ name: "company_id" })
  company!: Company;

  @Column({ type: "text" })
  title!: string;

  @Column({ type: "text" })
  description!: string;

  @Column({ type: "text" })
  requirements!: string;

  @Column({ type: "text" })
  industry!: string;

  @Column({ name: "salary_from", type: "int", nullable: true })
  salaryFrom!: number | null;

  @Column({ name: "salary_to", type: "int", nullable: true })
  salaryTo!: number | null;

  @Column({ name: "experience_level", type: "text" })
  experienceLevel!: ExperienceLevel;

  @Column({ type: "text", nullable: true })
  location!: string | null;

  @Column({ name: "employment_type", type: "text" })
  employmentType!: EmploymentType;

  @Column({ type: "text", default: "draft" })
  status!: VacancyStatus;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;
}
