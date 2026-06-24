import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm"
import { Restaurant } from "./restaurant.entity" // связь: какому ресторану принадлежит блюдо

@Entity("menu_items")          
export class MenuItem {
  @PrimaryGeneratedColumn()
  menu_item_id: number         

  @Column({ type: "int" })      
  restaurant_id: number

  @Column({ type: "varchar" }) 
  item_name: string

  @Column({ type: "text", nullable: true }) 
  details: string

  @Column({ type: "decimal", precision: 10, scale: 2 })  
  cost: number                 

  @Column({ type: "varchar" })  
  category_type: string

  @Column({ type: "boolean", default: true })  
  in_stock: boolean

  @Column({ type: "varchar", nullable: true }) 
  image_url: string

  @ManyToOne(() => Restaurant, restaurant => restaurant.menuItems)
  @JoinColumn({ name: "restaurant_id" })    
  restaurant: Restaurant
}