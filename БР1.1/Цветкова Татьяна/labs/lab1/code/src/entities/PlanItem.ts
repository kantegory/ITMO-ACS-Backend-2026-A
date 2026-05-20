import {
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  JoinColumn,
} from "typeorm";
import { WorkoutPlan } from "./WorkoutPlan";
import { Workout } from "./Workout";

@Entity("plan_items")
export class PlanItem {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => WorkoutPlan, (p) => p.items, { onDelete: "CASCADE" })
  @JoinColumn()
  plan: WorkoutPlan;

  @ManyToOne(() => Workout, (w) => w.planItems, {
    onDelete: "CASCADE",
    eager: true,
  })
  @JoinColumn()
  workout: Workout;

  @Column({ type: "int", default: 0 })
  dayOffset: number;

  @Column({ type: "int", default: 0 })
  orderIndex: number;

  @Column({ default: false })
  completed: boolean;

  @Column({ type: "text", nullable: true })
  notes?: string;
}
