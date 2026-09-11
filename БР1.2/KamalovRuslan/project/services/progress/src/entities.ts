import { Column, CreateDateColumn, Entity, Index, PrimaryColumn, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity("progress_entries")
export class ProgressEntry {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Index() @Column({ name: "user_id", type: "uuid" }) userId!: string;
  @Index() @Column({ name: "workout_id", type: "uuid" }) workoutId!: string;
  @Column({ name: "duration_minutes", type: "integer" }) durationMinutes!: number;
  @Column({ type: "text", nullable: true }) notes!: string | null;
  @Column({ name: "completed_at", type: "timestamptz" }) completedAt!: Date;
  @CreateDateColumn({ name: "created_at" }) createdAt!: Date;
}

