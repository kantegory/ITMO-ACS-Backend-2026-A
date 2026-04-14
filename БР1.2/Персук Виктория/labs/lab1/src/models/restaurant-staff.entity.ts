import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Restaurant } from './restaurant.entity';

@Entity('restaurant_staff')
export class RestaurantStaff {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    user_id!: number;

    @Column()
    restaurant_id!: number;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'user_id' })
    user!: User;

    @ManyToOne(() => Restaurant)
    @JoinColumn({ name: 'restaurant_id' })
    restaurant!: Restaurant;
}
