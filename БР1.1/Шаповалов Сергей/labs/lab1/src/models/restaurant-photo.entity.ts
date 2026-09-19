import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    BaseEntity,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
} from 'typeorm';
import { Restaurant } from './restaurant.entity';

@Entity('restaurant_photos')
export class RestaurantPhoto extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'restaurant_id', type: 'int' })
    restaurantId: number;

    @Column({ name: 'photo_url', type: 'varchar', length: 500, nullable: true })
    photoUrl: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @ManyToOne(() => Restaurant, (restaurant) => restaurant.photos, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'restaurant_id' })
    restaurant: Restaurant;
}
