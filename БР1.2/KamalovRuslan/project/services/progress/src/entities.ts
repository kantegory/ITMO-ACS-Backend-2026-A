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

@Entity("workout_snapshots")
export class WorkoutSnapshot {
  @PrimaryColumn({ type: "uuid" }) id!: string;
  @Column({ length: 120 }) name!: string;
  @Column({ type: "varchar" }) type!: string;
  @Column({ type: "varchar" }) level!: string;
  @Column({ name: "source_event_id", type: "uuid", unique: true }) sourceEventId!: string;
  @UpdateDateColumn({ name: "updated_at" }) updatedAt!: Date;
}
