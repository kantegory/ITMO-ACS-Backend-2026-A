import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Restaurant } from './restaurant.entity';

@Entity('restaurant_photos')
export class RestaurantPhoto {
    @PrimaryGeneratedColumn()
    photo_id!: number;

    @Column()
    restaurant_id!: number;

    @Column({ type: 'text' })
    url!: string;

    @ManyToOne(() => Restaurant)
    @JoinColumn({ name: 'restaurant_id' })
    restaurant!: Restaurant;
}
