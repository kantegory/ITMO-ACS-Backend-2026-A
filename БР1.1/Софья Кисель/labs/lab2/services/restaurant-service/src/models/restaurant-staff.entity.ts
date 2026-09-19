import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
} from 'typeorm';

import { Restaurant } from './restaurant.entity';

@Entity('restaurant_staff')
export class RestaurantStaff {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: 'int' })
    user_id!: number;

    @Column({ type: 'int' })
    restaurant_id!: number;

    @ManyToOne(() => Restaurant)
    @JoinColumn({ name: 'restaurant_id' })
    restaurant!: Restaurant;
}
