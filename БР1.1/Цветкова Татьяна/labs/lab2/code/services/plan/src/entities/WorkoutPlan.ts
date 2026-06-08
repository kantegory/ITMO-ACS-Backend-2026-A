import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { PlanItem } from "./PlanItem";

@Entity("workout_plans")
export class WorkoutPlan {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  userId: string; // ссылается на auth.users.id логически

  @Column()
  title: string;

  @Column({ type: "text", nullable: true })
  description?: string;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => PlanItem, (i) => i.plan, { cascade: true, eager: true })
  items: PlanItem[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
