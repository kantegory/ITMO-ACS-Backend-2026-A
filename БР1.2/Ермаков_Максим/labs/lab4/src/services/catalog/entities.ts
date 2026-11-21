import {
    Column,
    Entity,
    JoinTable,
    ManyToMany,
    ManyToOne,
    OneToMany,
} from 'typeorm';
import { AppBaseEntity } from '../../common/base.entity';
import { PriceCategory } from '../../common/enums';

@Entity({ name: 'locations' })
export class Location extends AppBaseEntity {
    @Column({ type: 'varchar', length: 100 })
    city: string;

    @Column({ type: 'varchar', length: 255 })
    address: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    district?: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    metroStation?: string;

    @OneToMany(() => Restaurant, (restaurant) => restaurant.location)
    restaurants: Restaurant[];
}

@Entity({ name: 'cuisines' })
export class Cuisine extends AppBaseEntity {
    @Column({ type: 'varchar', length: 100, unique: true })
    title: string;

    @ManyToMany(() => Restaurant, (restaurant) => restaurant.cuisines)
    restaurants: Restaurant[];
}

@Entity({ name: 'restaurants' })
export class Restaurant extends AppBaseEntity {
    @Column({ type: 'varchar', length: 150 })
    title: string;

    @Column({ type: 'text', nullable: true })
    description?: string;

    @Column({ type: 'varchar', length: 30 })
    phone: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    email?: string;

    @Column({ type: 'varchar', length: 5 })
    openTime: string;

    @Column({ type: 'varchar', length: 5 })
    closeTime: string;

    @Column({
        type: 'enum',
        enum: PriceCategory,
        default: PriceCategory.MEDIUM,
    })
    priceCategory: PriceCategory;

    @Column({ type: 'float', default: 0 })
    avgRating: number;

    @Column({ type: 'int', default: 0 })
    reviewsCount: number;

    @Column({ type: 'boolean', default: false })
    isPublished: boolean;

    @ManyToOne(() => Location, (location) => location.restaurants, {
        nullable: false,
        onDelete: 'RESTRICT',
    })
    location: Location;

    @ManyToMany(() => Cuisine, (cuisine) => cuisine.restaurants)
    @JoinTable({
        name: 'restaurant_cuisines',
        joinColumn: { name: 'restaurant_id' },
        inverseJoinColumn: { name: 'cuisine_id' },
    })
    cuisines: Cuisine[];

    @OneToMany(() => RestaurantPhoto, (photo) => photo.restaurant)
    photos: RestaurantPhoto[];
}

@Entity({ name: 'restaurant_photos' })
export class RestaurantPhoto extends AppBaseEntity {
    @Column({ type: 'varchar', length: 500 })
    imageUrl: string;

    @Column({ type: 'boolean', default: false })
    isMain: boolean;

    @ManyToOne(() => Restaurant, (restaurant) => restaurant.photos, {
        nullable: false,
        onDelete: 'CASCADE',
    })
    restaurant: Restaurant;
}
