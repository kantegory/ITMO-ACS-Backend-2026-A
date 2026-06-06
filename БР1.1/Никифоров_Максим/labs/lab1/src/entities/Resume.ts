import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { User } from "./User";

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

  @ManyToOne(() => User, (u) => u.resumes, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user!: User;

  @Column({ type: "text" })
  title!: string;

  @Column({ type: "text", nullable: true })
  summary!: string | null;

  @Column({ name: "experience_level", type: "text" })
  experienceLevel!: ExperienceLevel;

  @Column({ type: "text", array: true, default: [] })
  skills!: string[];

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;
}
