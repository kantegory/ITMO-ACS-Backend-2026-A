import { Entity, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { Restaurant } from './restaurant.entity';

@Entity('restaurant_owners')
export class RestaurantOwner {
    @PrimaryColumn()
    user_id!: number;

    @PrimaryColumn()
    restaurant_id!: number;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'user_id' })
    user!: User;

    @ManyToOne(() => Restaurant)
    @JoinColumn({ name: 'restaurant_id' })
    restaurant!: Restaurant;
}
