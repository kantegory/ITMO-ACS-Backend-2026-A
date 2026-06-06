import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { ResumeSummary } from "./ResumeSummary";
import { ResumeSkill } from "./ResumeSkill";

export type ExperienceLevel =
  | "no_experience"
  | "junior"
  | "middle"
  | "senior"
  | "lead";

@Entity("resumes")
export class Resume {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "user_id", type: "uuid" })
  userId!: string;

  @Column({ type: "text" })
  title!: string;

  @Column({ name: "experience_level", type: "text" })
  experienceLevel!: ExperienceLevel;

  @OneToOne(() => ResumeSummary, (s) => s.resume)
  summary?: ResumeSummary | null;

  @OneToMany(() => ResumeSkill, (rs) => rs.resume)
  resumeSkills?: ResumeSkill[];

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;
}
