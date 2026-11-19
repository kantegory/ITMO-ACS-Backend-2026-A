import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Restaurant } from "./Restaurant";

@Entity("restaurant_photos")
export class RestaurantPhoto {
  @PrimaryGeneratedColumn({ name: "photo_id", type: "integer" })
  photoId!: number;

  @ManyToOne(() => Restaurant, (restaurant) => restaurant.photos, { onDelete: "CASCADE" })
  @JoinColumn({ name: "restaurant_id" })
  restaurant!: Restaurant;

  @Column({ type: "varchar", name: "photo_url", length: 500 })
  photoUrl!: string;

  @CreateDateColumn({ type: "datetime", name: "uploaded_at" })
  uploadedAt!: Date;
}
