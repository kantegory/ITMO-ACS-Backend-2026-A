import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  ManyToMany,
  JoinTable,
} from "typeorm";
import { User } from "./User";
import { Exercise } from "./Exercise";

export enum WorkoutType {
  CARDIO = "cardio",
  STRENGTH = "strength",
  HIIT = "hiit",
  YOGA = "yoga",
  PILATES = "pilates",
  STRETCHING = "stretching",
}

export enum DifficultyLevel {
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

  @Column({ type: "simple-enum", enum: WorkoutType })
  type: WorkoutType;

  @Column({ type: "simple-enum", enum: DifficultyLevel })
  difficulty_level: DifficultyLevel;

  @Column({ type: "text", nullable: true })
  description: string;

  @Column()
  duration_min: number;

  @Column({ nullable: true })
  video_url: string;

  @Column({ type: "text", nullable: true })
  instructions: string;

  @Column()
  created_by: string;

  @ManyToOne(() => User)
  created_by_user: User;

  @Column({ default: true })
  is_published: boolean;

  @CreateDateColumn()
  created_at: Date;

  @ManyToMany(() => Exercise)
  @JoinTable({
    name: "workout_exercises",
    joinColumn: { name: "workout_id", referencedColumnName: "id" },
    inverseJoinColumn: { name: "exercise_id", referencedColumnName: "id" },
  })
  exercises: Exercise[];
}
