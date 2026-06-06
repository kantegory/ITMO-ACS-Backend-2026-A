import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Resume } from "./Resume";

@Entity("resume_summaries")
export class ResumeSummary {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "resume_id", type: "uuid", unique: true })
  resumeId!: string;

  @OneToOne(() => Resume, (r) => r.summary, { onDelete: "CASCADE" })
  @JoinColumn({ name: "resume_id" })
  resume!: Resume;

  @Column({ type: "text" })
  content!: string;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;
}
