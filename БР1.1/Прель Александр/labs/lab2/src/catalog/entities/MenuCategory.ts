import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { MenuItem } from "./MenuItem";
import { Restaurant } from "./Restaurant";

@Entity("menu_categories")
export class MenuCategory {
  @PrimaryGeneratedColumn({ name: "category_id" })
  categoryId!: number;

  @ManyToOne(() => Restaurant, (restaurant) => restaurant.menuCategories, { onDelete: "CASCADE" })
  @JoinColumn({ name: "restaurant_id" })
  restaurant!: Restaurant;

  @Column({ length: 255 })
  name!: string;

  @OneToMany(() => MenuItem, (item) => item.category)
  items!: MenuItem[];
}
