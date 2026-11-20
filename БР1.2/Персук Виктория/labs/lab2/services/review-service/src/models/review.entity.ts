import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { RatingEnum } from '../common/enums';

// user_id and restaurant_id reference other DBs — no ORM relations
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
}
