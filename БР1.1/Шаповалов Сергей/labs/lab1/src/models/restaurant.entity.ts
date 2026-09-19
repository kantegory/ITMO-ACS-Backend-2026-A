import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    BaseEntity,
    CreateDateColumn,
    OneToMany,
} from 'typeorm';
import { RestaurantCuisine } from './restaurant-cuisine.entity';
import { RestaurantPhoto } from './restaurant-photo.entity';
import { Review } from './review.entity';
import { MenuItem } from './menu-item.entity';
import { Reservation } from './reservation.entity';

@Entity('restaurants')
export class Restaurant extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 255 })
    name: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ type: 'varchar', length: 255 })
    address: string;

    @Column({ name: 'price_range', type: 'int', nullable: true })
    priceRange: number;

    @Column({ type: 'varchar', length: 100, nullable: true })
    district: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @OneToMany(
        () => RestaurantCuisine,
        (restaurantCuisine) => restaurantCuisine.restaurant,
    )
    restaurantCuisines: RestaurantCuisine[];

    @OneToMany(() => RestaurantPhoto, (photo) => photo.restaurant)
    photos: RestaurantPhoto[];

    @OneToMany(() => Review, (review) => review.restaurant)
    reviews: Review[];

    @OneToMany(() => MenuItem, (menuItem) => menuItem.restaurant)
    menuItems: MenuItem[];

    @OneToMany(() => Reservation, (reservation) => reservation.restaurant)
    reservations: Reservation[];
}
