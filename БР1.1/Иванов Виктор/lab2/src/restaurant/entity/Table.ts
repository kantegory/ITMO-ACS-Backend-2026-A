import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, OneToMany } from "typeorm";
import { Restaurant } from "./Restaurant";

@Entity("tables")
export class Table {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  restaurant_id: string;

  @Column()
  table_number: string;

  @Column({ type: "int" })
  capacity: number;

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => Restaurant, (restaurant) => restaurant.tables)
  @JoinColumn({ name: "restaurant_id" })
  restaurant: Restaurant;
}
