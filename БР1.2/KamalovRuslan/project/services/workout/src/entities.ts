import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, Unique } from "typeorm";

export type WorkoutType = "cardio" | "strength" | "mobility";
export type WorkoutLevel = "beginner" | "intermediate" | "advanced";

@Entity("workouts")
export class Workout {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Column({ length: 120 }) name!: string;
  @Column({ type: "varchar" }) type!: WorkoutType;
  @Column({ type: "varchar" }) level!: WorkoutLevel;
  @Column({ name: "duration_minutes", type: "integer" }) durationMinutes!: number;
  @Column({ type: "text" }) description!: string;
  @Column({ name: "video_url", type: "varchar", nullable: true }) videoUrl!: string | null;
  @CreateDateColumn({ name: "created_at" }) createdAt!: Date;
}

@Entity("training_plans")
export class TrainingPlan {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Index() @Column({ name: "user_id", type: "uuid" }) userId!: string;
  @Column({ length: 120 }) name!: string;
  @CreateDateColumn({ name: "created_at" }) createdAt!: Date;
}

@Entity("plan_workouts")
@Unique(["planId", "workoutId"])
export class PlanWorkout {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Index() @Column({ name: "plan_id", type: "uuid" }) planId!: string;
  @Index() @Column({ name: "workout_id", type: "uuid" }) workoutId!: string;
  @Column({ type: "integer" }) position!: number;
}
