import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from "typeorm";
import { Table } from "./Table";
import { Review } from "./Review";

@Entity("restaurants")
export class Restaurant {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true, type: "text" })
  description: string;

  @Column()
  address: string;

  @Column()
  phone: string;

  @Column()
  cuisine_type: string;

  @Column({ type: "int" })
  price_range: number;

  @Column({ type: "float", default: 0 })
  rating: number;

  @CreateDateColumn()
  created_at: Date;

  @OneToMany(() => Table, (table) => table.restaurant)
  tables: Table[];

  @OneToMany(() => Review, (review) => review.restaurant)
  reviews: Review[];
}
