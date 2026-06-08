import {
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Workout } from "./Workout";

@Entity("workout_categories")
export class WorkoutCategory {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ nullable: true })
  iconUrl?: string;

  @OneToMany(() => Workout, (w) => w.category)
  workouts: Workout[];
}
