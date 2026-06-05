// блюда в меню ресторана каждый ресторан имеет много блюд (OneToMany у Restaurant)

import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm"
import { Restaurant } from "./restaurant.entity" // связь: какому ресторану принадлежит блюдо

@Entity("menu_items")          
export class MenuItem {
  @PrimaryGeneratedColumn()
  menu_item_id: number         

  @Column({ type: "int" })      // внешний ключ → restaurants.restaurant_id
  restaurant_id: number

  @Column({ type: "varchar" }) 
  item_name: string

  @Column({ type: "text", nullable: true })  // описание блюда (необязательно)
  details: string

  @Column({ type: "decimal", precision: 10, scale: 2 })  // цена (10 цифр, 2 после запятой)
  cost: number                 

  @Column({ type: "varchar" })  // категория: "Паста", "Пицца", "Супы", "Десерты"
  category_type: string

  @Column({ type: "boolean", default: true })  // доступно ли блюдо сейчас
  in_stock: boolean

  @Column({ type: "varchar", nullable: true })  // ссылка на фото блюда (необязательно)
  image_url: string

  // связь: ОДНО блюдо принадлежит ОДНОМУ ресторану
  @ManyToOne(() => Restaurant, restaurant => restaurant.menuItems)
  @JoinColumn({ name: "restaurant_id" })    // колонка-внешний ключ
  restaurant: Restaurant
}