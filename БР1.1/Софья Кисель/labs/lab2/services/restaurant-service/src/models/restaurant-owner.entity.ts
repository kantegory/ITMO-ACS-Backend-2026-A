import { Entity, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Restaurant } from './restaurant.entity';

@Entity('restaurant_owners')
export class RestaurantOwner {
    @PrimaryColumn({ type: 'int' })
    user_id!: number;

    @PrimaryColumn({ type: 'int' })
    restaurant_id!: number;

    @ManyToOne(() => Restaurant)
    @JoinColumn({ name: 'restaurant_id' })
    restaurant!: Restaurant;
}
