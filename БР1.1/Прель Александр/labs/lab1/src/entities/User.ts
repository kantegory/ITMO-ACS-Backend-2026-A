import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Reservation } from "./Reservation";
import { Review } from "./Review";

@Entity("users")
export class User {
  @PrimaryGeneratedColumn({ name: "user_id", type: "integer" })
  userId!: number;

  @Column({ type: "varchar", name: "first_name", length: 100 })
  firstName!: string;

  @Column({ type: "varchar", name: "last_name", length: 100 })
  lastName!: string;

  @Column({ type: "varchar", unique: true, length: 255 })
  email!: string;

  @Column({ type: "varchar", length: 32 })
  phone!: string;

  @Column({ type: "varchar", name: "password_hash", length: 255 })
  passwordHash!: string;

  @CreateDateColumn({ type: "datetime", name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "datetime", name: "updated_at" })
  updatedAt!: Date;

  @OneToMany(() => Reservation, (reservation) => reservation.user)
  reservations!: Reservation[];

  @OneToMany(() => Review, (review) => review.user)
  reviews!: Review[];
}
