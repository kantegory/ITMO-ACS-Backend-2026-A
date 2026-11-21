import { Column, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { AppBaseEntity } from './base.entity';
import { Restaurant } from './restaurant.entity';
import { User } from './user.entity';

@Entity({ name: 'reviews' })
@Unique(['restaurant', 'user'])
export class Review extends AppBaseEntity {
    @Column({ type: 'float' })
    rating: number;

    @Column({ type: 'text' })
    comment: string;

    @ManyToOne(() => Restaurant, (restaurant) => restaurant.reviews, {
        nullable: false,
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'restaurantId' })
    restaurant: Restaurant;

    @ManyToOne(() => User, (user) => user.reviews, {
        nullable: false,
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'userId' })
    user: User;
}
