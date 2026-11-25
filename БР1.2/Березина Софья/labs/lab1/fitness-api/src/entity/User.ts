import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  OneToMany,
} from "typeorm";
import { UserProfile } from "./UserProfile";
import { UserProgress } from "./UserProgress";
import { UserWorkout } from "./UserWorkout";

export enum UserRole {
  USER = "user",
  ADMIN = "admin",
  TRAINER = "trainer",
}

@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password_hash: string;

  @Column({ type: "simple-enum", enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToOne(() => UserProfile, (profile) => profile.user)
  profile: UserProfile;

  @OneToMany(() => UserProgress, (progress) => progress.user)
  progress_entries: UserProgress[];

  @OneToMany(() => UserWorkout, (userWorkout) => userWorkout.user)
  user_workouts: UserWorkout[];
}
