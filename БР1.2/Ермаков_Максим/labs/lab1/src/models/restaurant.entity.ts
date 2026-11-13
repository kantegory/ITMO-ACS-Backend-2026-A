import {
    Column,
    Entity,
    JoinColumn,
    JoinTable,
    ManyToMany,
    ManyToOne,
    OneToMany,
} from 'typeorm';
import { AppBaseEntity } from './base.entity';
import { PriceCategory } from '../common/enums';
import { Cuisine } from './cuisine.entity';
import { Location } from './location.entity';
import { MenuCategory } from './menu-category.entity';
import { Reservation } from './reservation.entity';
import { RestaurantPhoto } from './restaurant-photo.entity';
import { RestaurantTable } from './restaurant-table.entity';
import { Review } from './review.entity';

@Entity({ name: 'restaurants' })
export class Restaurant extends AppBaseEntity {
    @Column({ type: 'varchar', length: 150 })
    title: string;

    @Column({ type: 'text', nullable: true })
    description?: string | null;

    @Column({ type: 'varchar', length: 30 })
    phone: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    email?: string | null;

    @Column({ type: 'varchar', length: 5 })
    openTime: string;

    @Column({ type: 'varchar', length: 5 })
    closeTime: string;

    @Column({
        type: 'enum',
        enum: PriceCategory,
    })
    priceCategory: PriceCategory;

    @Column({ type: 'float', default: 0 })
    avgRating: number;

    @Column({ type: 'boolean', default: false })
    isPublished: boolean;

    @ManyToOne(() => Location, (location) => location.restaurants, {
        nullable: false,
        onDelete: 'RESTRICT',
    })
    @JoinColumn({ name: 'locationId' })
    location: Location;

    @ManyToMany(() => Cuisine, (cuisine) => cuisine.restaurants)
    @JoinTable({
        name: 'restaurant_cuisines',
        joinColumn: { name: 'restaurantId', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'cuisineId', referencedColumnName: 'id' },
    })
    cuisines: Cuisine[];

    @OneToMany(() => RestaurantTable, (table) => table.restaurant)
    tables: RestaurantTable[];

    @OneToMany(() => RestaurantPhoto, (photo) => photo.restaurant)
    photos: RestaurantPhoto[];

    @OneToMany(() => MenuCategory, (category) => category.restaurant)
    menuCategories: MenuCategory[];

    @OneToMany(() => Review, (review) => review.restaurant)
    reviews: Review[];

    @OneToMany(() => Reservation, (reservation) => reservation.restaurant)
    reservations: Reservation[];
}
