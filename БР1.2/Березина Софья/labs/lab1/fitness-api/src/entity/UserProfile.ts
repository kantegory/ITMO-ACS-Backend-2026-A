import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
} from "typeorm";
import { User } from "./User";

export enum Gender {
  MALE = "male",
  FEMALE = "female",
}

export enum FitnessLevel {
  BEGINNER = "beginner",
  INTERMEDIATE = "intermediate",
  ADVANCED = "advanced",
  PROFESSIONAL = "professional",
}

export enum ActivityLevel {
  SEDENTARY = "sedentary",
  LIGHT = "light",
  MODERATE = "moderate",
  ACTIVE = "active",
  VERY_ACTIVE = "very_active",
}

@Entity("user_profiles")
export class UserProfile {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  user_id: string;

  @OneToOne(() => User)
  @JoinColumn({ name: "user_id" })
  user: User;

  @Column({ nullable: true })
  full_name: string;

  @Column({ type: "date", nullable: true })
  birth_date: Date;

  @Column({ type: "simple-enum", enum: Gender, nullable: true })
  gender: Gender;

  @Column({ type: "simple-enum", enum: FitnessLevel, nullable: true })
  fitness_level: FitnessLevel;

  @Column({ type: "float", nullable: true })
  height_cm: number;

  @Column({ type: "float", nullable: true })
  weight_kg: number;

  @Column({ type: "simple-enum", enum: ActivityLevel, nullable: true })
  activity_level: ActivityLevel;

  @Column({ nullable: true })
  avatar_url: string;
}
