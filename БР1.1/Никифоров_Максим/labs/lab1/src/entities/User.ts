import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { CandidateProfile } from "./CandidateProfile";
import { Resume } from "./Resume";
import { Company } from "./Company";
import { RefreshSession } from "./RefreshSession";

export type UserRole = "candidate" | "employer" | "admin";

@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "text", unique: true })
  email!: string;

  @Column({ name: "password_hash", type: "text" })
  passwordHash!: string;

  @Column({ type: "text" })
  role!: UserRole;

  @Column({ name: "full_name", type: "text" })
  fullName!: string;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;

  @OneToOne(() => CandidateProfile, (p) => p.user)
  candidateProfile?: CandidateProfile;

  @OneToMany(() => Resume, (r) => r.user)
  resumes?: Resume[];

  @OneToOne(() => Company, (c) => c.owner)
  company?: Company;

  @OneToMany(() => RefreshSession, (s) => s.user)
  sessions?: RefreshSession[];
}
