import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm"
import { Restaurant } from "./restaurant.entity"

@Entity("tables")
export class Table {
  @PrimaryGeneratedColumn()
  table_id: number

  @Column({ type: "int" })
  restaurant_id: number

  @Column({ type: "varchar" })
  table_num: string

  @Column({ type: "int" })
  capacity: number

  @Column({ type: "boolean", default: true })
  is_available: boolean

  @Column({ type: "varchar", nullable: true })
  area: string

  @ManyToOne(() => Restaurant, restaurant => restaurant.tables)
  @JoinColumn({ name: "restaurant_id" })
  restaurant: Restaurant
}