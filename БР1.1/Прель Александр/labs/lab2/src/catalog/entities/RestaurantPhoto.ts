import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Restaurant } from "./Restaurant";

@Entity("restaurant_photos")
export class RestaurantPhoto {
  @PrimaryGeneratedColumn({ name: "photo_id" })
  photoId!: number;

  @ManyToOne(() => Restaurant, (restaurant) => restaurant.photos, { onDelete: "CASCADE" })
  @JoinColumn({ name: "restaurant_id" })
  restaurant!: Restaurant;

  @Column({ name: "photo_url", length: 500 })
  photoUrl!: string;

  @CreateDateColumn({ name: "uploaded_at" })
  uploadedAt!: Date;
}
