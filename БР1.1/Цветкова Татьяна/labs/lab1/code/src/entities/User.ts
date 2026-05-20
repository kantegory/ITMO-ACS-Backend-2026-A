import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { WorkoutPlan } from "./WorkoutPlan";
import { ProgressEntry } from "./ProgressEntry";
import { BlogPost } from "./BlogPost";
import { BlogComment } from "./BlogComment";

export enum UserRole {
  USER = "user",
  ADMIN = "admin",
  TRAINER = "trainer",
}

export enum FitnessLevel {
  BEGINNER = "beginner",
  INTERMEDIATE = "intermediate",
  ADVANCED = "advanced",
}

@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ unique: true })
  username: string;

  @Column({ select: false })
  passwordHash: string;

  @Column({ nullable: true })
  firstName?: string;

  @Column({ nullable: true })
  lastName?: string;

  @Column({ type: "date", nullable: true })
  birthDate?: Date;

  @Column({ type: "float", nullable: true })
  weightKg?: number;

  @Column({ type: "float", nullable: true })
  heightCm?: number;

  @Column({ type: "varchar", default: FitnessLevel.BEGINNER })
  fitnessLevel: FitnessLevel;

  @Column({ type: "varchar", default: UserRole.USER })
  role: UserRole;

  @Column({ nullable: true })
  avatarUrl?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => WorkoutPlan, (plan) => plan.user)
  plans: WorkoutPlan[];

  @OneToMany(() => ProgressEntry, (entry) => entry.user)
  progress: ProgressEntry[];

  @OneToMany(() => BlogPost, (post) => post.author)
  posts: BlogPost[];

  @OneToMany(() => BlogComment, (c) => c.author)
  comments: BlogComment[];
}
