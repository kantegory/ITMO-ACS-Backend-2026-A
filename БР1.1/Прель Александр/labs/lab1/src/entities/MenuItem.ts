import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { MenuCategory } from "./MenuCategory";

@Entity("menu_items")
export class MenuItem {
  @PrimaryGeneratedColumn({ name: "item_id", type: "integer" })
  itemId!: number;

  @ManyToOne(() => MenuCategory, (category) => category.items, { onDelete: "CASCADE" })
  @JoinColumn({ name: "category_id" })
  category!: MenuCategory;

  @Column({ type: "varchar", length: 255 })
  name!: string;

  @Column({ type: "text", nullable: true })
  description!: string | null;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  price!: number;

  @Column({ type: "boolean", name: "is_available", default: true })
  isAvailable!: boolean;
}
