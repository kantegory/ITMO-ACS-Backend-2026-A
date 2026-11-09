import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm";
import { User } from "./User";

@Entity()
export class UserProgress {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  user_id: string;

  @ManyToOne(() => User)
  user: User;

  @Column({ type: "date" })
  date: Date;

  @Column({ type: "float", nullable: true })
  height_cm: number;

  @Column({ type: "float" })
  weight_kg: number;

  @Column({ type: "float", nullable: true })
  muscle_mass_kg: number;
}
