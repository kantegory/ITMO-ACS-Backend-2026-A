import { Entity, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Restaurant } from './restaurant.entity';
import { Cuisine } from './cuisine.entity';

@Entity('restaurant_cuisines')
export class RestaurantCuisine {
    @PrimaryColumn({ type: 'int' })
    restaurant_id!: number;

    @PrimaryColumn({ type: 'int' })
    cuisine_id!: number;

    @ManyToOne(() => Restaurant)
    @JoinColumn({ name: 'restaurant_id' })
    restaurant!: Restaurant;

    @ManyToOne(() => Cuisine)
    @JoinColumn({ name: 'cuisine_id' })
    cuisine!: Cuisine;
}
