import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    BaseEntity,
} from 'typeorm';

import { Booking } from './booking.entity';
import { User } from './user.entity';

@Entity()
export class Review extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Booking, (booking) => booking.reviews, {
        nullable: false,
    })
    @JoinColumn({ name: 'bookingId' })
    booking: Booking;

    @Column({ type: 'int' })
    bookingId: number;

    @ManyToOne(() => User, { nullable: false })
    @JoinColumn({ name: 'authorId' })
    author: User;

    @Column({ type: 'int' })
    authorId: number;

    @Column({ type: 'int' })
    rating: number;

    @Column({ type: 'text', nullable: true })
    text: string;

    @CreateDateColumn()
    createdAt: Date;
}
