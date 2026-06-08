import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { WorkoutPlan } from "./WorkoutPlan";

@Entity("plan_items")
export class PlanItem {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => WorkoutPlan, (p) => p.items, { onDelete: "CASCADE" })
  @JoinColumn()
  plan: WorkoutPlan;

  // Логическая ссылка на catalog.workouts (без FK, т.к. другая БД)
  @Column()
  workoutId: string;

  // ===== Денормализованный snapshot из catalog =====
  @Column()
  workoutTitleSnapshot: string;

  @Column({ type: "int" })
  workoutDurationMin: number;

  @Column({ type: "varchar" })
  workoutType: string;

  @Column({ default: false })
  workoutIsStale: boolean; // ставится при workout.deleted

  @Column({ type: "int", default: 0 })
  dayOffset: number;

  @Column({ type: "int", default: 0 })
  orderIndex: number;

  @Column({ default: false })
  completed: boolean;

  @Column({ type: "text", nullable: true })
  notes?: string;
}
