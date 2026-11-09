import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm";
import { User } from "./User";
import { Workout } from "./Workout";

export enum UserWorkoutStatus {
  SCHEDULED = "scheduled",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  SKIPPED = "skipped",
}

@Entity("user_workouts")
export class UserWorkout {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  user_id: string;

  @ManyToOne(() => User)
  user: User;

  @Column()
  workout_id: string;

  @ManyToOne(() => Workout)
  workout: Workout;

  @Column({
    type: "simple-enum",
    enum: UserWorkoutStatus,
    default: UserWorkoutStatus.SCHEDULED,
  })
  status: UserWorkoutStatus;

  @Column({ type: "date", nullable: true })
  scheduled_date: Date;

  @Column({ type: "date", nullable: true })
  completed_date: Date;

  @Column({ nullable: true })
  rating: number;

  @Column({ type: "text", nullable: true })
  result_notes: string;

  @Column({ nullable: true })
  completed_exercises_count: number;
}
