import {
    Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn,
    CreateDateColumn, BaseEntity,
} from 'typeorm';
import { Booking } from './booking.entity';

@Entity()
export class Review extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Booking, (b) => b.reviews, { nullable: false })
    @JoinColumn({ name: 'bookingId' })
    booking: Booking;

    @Column({ type: 'int' })
    bookingId: number;

    @Column({ type: 'int' })
    authorId: number;

    @Column({ type: 'int' })
    rating: number;

    @Column({ type: 'text', nullable: true })
    text: string;

    @CreateDateColumn()
    createdAt: Date;
}
