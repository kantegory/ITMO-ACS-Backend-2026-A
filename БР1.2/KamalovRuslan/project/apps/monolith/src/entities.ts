import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from "typeorm";

export type WorkoutType = "cardio" | "strength" | "mobility";
export type WorkoutLevel = "beginner" | "intermediate" | "advanced";

@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Index({ unique: true }) @Column() email!: string;
  @Column({ name: "password_hash" }) passwordHash!: string;
  @Column({ length: 100 }) name!: string;
  @Column({ type: "varchar", default: "user" }) role!: "user" | "admin";
  @CreateDateColumn({ name: "created_at" }) createdAt!: Date;
}

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
  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user!: User;
}

@Entity("plan_workouts")
@Unique(["planId", "workoutId"])
export class PlanWorkout {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Index() @Column({ name: "plan_id", type: "uuid" }) planId!: string;
  @Index() @Column({ name: "workout_id", type: "uuid" }) workoutId!: string;
  @Column({ name: "position", type: "integer" }) position!: number;
  @ManyToOne(() => TrainingPlan, { onDelete: "CASCADE" })
  @JoinColumn({ name: "plan_id" })
  plan!: TrainingPlan;
  @ManyToOne(() => Workout, { onDelete: "CASCADE" })
  @JoinColumn({ name: "workout_id" })
  workout!: Workout;
}

@Entity("progress_entries")
export class ProgressEntry {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Index() @Column({ name: "user_id", type: "uuid" }) userId!: string;
  @Index() @Column({ name: "workout_id", type: "uuid" }) workoutId!: string;
  @Column({ name: "duration_minutes", type: "integer" }) durationMinutes!: number;
  @Column({ type: "text", nullable: true }) notes!: string | null;
  @Column({ name: "completed_at", type: "timestamptz" }) completedAt!: Date;
  @CreateDateColumn({ name: "created_at" }) createdAt!: Date;
  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user!: User;
  @ManyToOne(() => Workout, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "workout_id" })
  workout!: Workout;
}

@Entity("articles")
export class Article {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Index() @Column({ name: "author_id", type: "uuid" }) authorId!: string;
  @Column({ length: 160 }) title!: string;
  @Index({ unique: true }) @Column({ length: 180 }) slug!: string;
  @Column({ type: "text" }) content!: string;
  @CreateDateColumn({ name: "created_at" }) createdAt!: Date;
  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "author_id" })
  author!: User;
}
