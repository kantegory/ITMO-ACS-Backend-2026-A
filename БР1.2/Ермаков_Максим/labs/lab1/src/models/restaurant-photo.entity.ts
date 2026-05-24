import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { AppBaseEntity } from './base.entity';
import { Restaurant } from './restaurant.entity';

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
    @JoinColumn({ name: 'restaurantId' })
    restaurant: Restaurant;
}
