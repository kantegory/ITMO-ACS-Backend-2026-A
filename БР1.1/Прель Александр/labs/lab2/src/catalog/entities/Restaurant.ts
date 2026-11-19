import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Cuisine } from "./Cuisine";
import { MenuCategory } from "./MenuCategory";
import { RestaurantPhoto } from "./RestaurantPhoto";
import { RestaurantTable } from "./RestaurantTable";
import { Review } from "./Review";

export type PriceCategory = "budget" | "medium" | "premium";

@Entity("restaurants")
export class Restaurant {
  @PrimaryGeneratedColumn({ name: "restaurant_id" })
  restaurantId!: number;

  @Column({ length: 255 })
  name!: string;

  @Column({ type: "text" })
  description!: string;

  @Column({ length: 255 })
  address!: string;

  @Column({ length: 100 })
  city!: string;

  @Column({ name: "price_category", length: 20 })
  priceCategory!: PriceCategory;

  @Column({ length: 32 })
  phone!: string;

  @Column({ name: "opening_time", length: 8 })
  openingTime!: string;

  @Column({ name: "closing_time", length: 8 })
  closingTime!: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @ManyToMany(() => Cuisine, (cuisine) => cuisine.restaurants)
  @JoinTable({
    name: "restaurant_cuisines",
    joinColumn: { name: "restaurant_id", referencedColumnName: "restaurantId" },
    inverseJoinColumn: { name: "cuisine_id", referencedColumnName: "cuisineId" },
  })
  cuisines!: Cuisine[];

  @OneToMany(() => RestaurantTable, (table) => table.restaurant)
  tables!: RestaurantTable[];

  @OneToMany(() => MenuCategory, (category) => category.restaurant)
  menuCategories!: MenuCategory[];

  @OneToMany(() => RestaurantPhoto, (photo) => photo.restaurant)
  photos!: RestaurantPhoto[];

  @OneToMany(() => Review, (review) => review.restaurant)
  reviews!: Review[];
}
