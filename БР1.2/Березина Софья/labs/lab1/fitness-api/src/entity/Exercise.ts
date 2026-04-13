import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from "typeorm";
import { Workout } from "./Workout";

@Entity("exercises")
export class Exercise {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  title: string;

  @Column({ type: "text", nullable: true })
  description: string;

  @Column({ nullable: true })
  target_muscle_group: string;

  @Column({ nullable: true })
  equipment: string;

  @Column({ type: "text", nullable: true })
  instructions: string;

  @Column({ nullable: true })
  video_url: string;
}
