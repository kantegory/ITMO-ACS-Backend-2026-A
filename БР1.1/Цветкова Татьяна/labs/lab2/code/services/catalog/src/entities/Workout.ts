import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { WorkoutCategory } from "./WorkoutCategory";

export type WorkoutType = "cardio" | "strength" | "yoga" | "stretching" | "hiit" | "mixed";
export type WorkoutLevel = "beginner" | "intermediate" | "advanced";

@Entity("workouts")
export class Workout {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  title: string;

  @Column({ type: "text" })
  description: string;

  @Column({ type: "text", nullable: true })
  instructions?: string;

  @Column()
  videoUrl: string;

  @Column({ nullable: true })
  thumbnailUrl?: string;

  @Column({ type: "varchar", default: "mixed" })
  type: WorkoutType;

  @Column({ type: "varchar", default: "beginner" })
  level: WorkoutLevel;

  @Column({ type: "int" })
  durationMinutes: number;

  @Column({ type: "int", nullable: true })
  caloriesBurned?: number;

  @Column({ default: true })
  active: boolean;

  @ManyToOne(() => WorkoutCategory, (c) => c.workouts, {
    nullable: true,
    eager: true,
    onDelete: "SET NULL",
  })
  @JoinColumn()
  category?: WorkoutCategory;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
