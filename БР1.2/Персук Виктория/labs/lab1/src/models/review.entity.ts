import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';
import { RatingEnum } from '../common/enums';
import { User } from './user.entity';
import { Restaurant } from './restaurant.entity';

@Entity('reviews')
export class Review {
    @PrimaryGeneratedColumn()
    review_id!: number;

    @Column({ type: 'int' })
    user_id!: number;

    @Column({ type: 'int' })
    restaurant_id!: number;

    @Column({ type: 'enum', enum: RatingEnum, nullable: true })
    rating!: RatingEnum;

    @Column({ type: 'text', nullable: true })
    comment!: string;

    @CreateDateColumn()
    created_at!: Date;

    @UpdateDateColumn()
    updated_at!: Date;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'user_id' })
    user!: User;

    @ManyToOne(() => Restaurant)
    @JoinColumn({ name: 'restaurant_id' })
    restaurant!: Restaurant;
}
