import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  JoinColumn,
} from "typeorm";
import { User } from "./User";
import { Workout } from "./Workout";

@Entity("progress_entries")
export class ProgressEntry {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => User, (u) => u.progress, { onDelete: "CASCADE" })
  @JoinColumn()
  user: User;

  @ManyToOne(() => Workout, (w) => w.progressEntries, {
    onDelete: "SET NULL",
    nullable: true,
    eager: true,
  })
  @JoinColumn()
  workout?: Workout;

  @Column({ type: "int" })
  durationMinutes: number;

  @Column({ type: "int", nullable: true })
  caloriesBurned?: number;

  @Column({ type: "float", nullable: true })
  weightKg?: number;

  @Column({ type: "int", nullable: true })
  rating?: number;

  @Column({ type: "text", nullable: true })
  notes?: string;

  @Column({ type: "datetime" })
  performedAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}
