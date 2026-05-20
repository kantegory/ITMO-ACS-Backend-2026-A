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
import { User } from "./User";
import { PlanItem } from "./PlanItem";

@Entity("workout_plans")
export class WorkoutPlan {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  title: string;

  @Column({ type: "text", nullable: true })
  description?: string;

  @Column({ type: "date", nullable: true })
  startDate?: Date;

  @Column({ type: "date", nullable: true })
  endDate?: Date;

  @Column({ default: true })
  isActive: boolean;

  @ManyToOne(() => User, (u) => u.plans, { onDelete: "CASCADE" })
  @JoinColumn()
  user: User;

  @OneToMany(() => PlanItem, (item) => item.plan, {
    cascade: true,
    eager: true,
  })
  items: PlanItem[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
