import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  JoinColumn,
} from "typeorm";
import { WorkoutCategory } from "./WorkoutCategory";
import { PlanItem } from "./PlanItem";
import { ProgressEntry } from "./ProgressEntry";

export enum WorkoutType {
  CARDIO = "cardio",
  STRENGTH = "strength",
  YOGA = "yoga",
  STRETCHING = "stretching",
  HIIT = "hiit",
  MIXED = "mixed",
}

export enum WorkoutLevel {
  BEGINNER = "beginner",
  INTERMEDIATE = "intermediate",
  ADVANCED = "advanced",
}

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

  @Column({ type: "varchar", default: WorkoutType.MIXED })
  type: WorkoutType;

  @Column({ type: "varchar", default: WorkoutLevel.BEGINNER })
  level: WorkoutLevel;

  @Column({ type: "int" })
  durationMinutes: number;

  @Column({ type: "int", nullable: true })
  caloriesBurned?: number;

  @Column({ type: "simple-array", nullable: true })
  equipment?: string[];

  @Column({ type: "simple-array", nullable: true })
  muscleGroups?: string[];

  @ManyToOne(() => WorkoutCategory, (c) => c.workouts, {
    nullable: true,
    onDelete: "SET NULL",
  })
  @JoinColumn()
  category?: WorkoutCategory;

  @OneToMany(() => PlanItem, (item) => item.workout)
  planItems: PlanItem[];

  @OneToMany(() => ProgressEntry, (entry) => entry.workout)
  progressEntries: ProgressEntry[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
