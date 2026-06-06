import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { User } from "./User";
import { Vacancy } from "./Vacancy";

@Entity("companies")
export class Company {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "owner_id", type: "uuid", unique: true })
  ownerId!: string;

  @OneToOne(() => User, (u) => u.company, { onDelete: "CASCADE" })
  @JoinColumn({ name: "owner_id" })
  owner!: User;

  @Column({ type: "text" })
  name!: string;

  @Column({ type: "text", nullable: true })
  description!: string | null;

  @Column({ type: "text", nullable: true })
  website!: string | null;

  @Column({ type: "text" })
  industry!: string;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;

  @OneToMany(() => Vacancy, (v) => v.company)
  vacancies?: Vacancy[];
}
