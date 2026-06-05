import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    BaseEntity,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn,
    Index,
} from 'typeorm';
import { User } from './user.entity';
import { Rental } from './rental.entity';

@Entity('landlord_reviews')
@Index(['rentalId', 'reviewerId'], { unique: true })
export class LandlordReview extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Index()
    @Column({ nullable: false })
    landlordId: number;

    @Index()
    @Column({ nullable: false })
    reviewerId: number;

    @Column({ nullable: false })
    rentalId: number;

    @Column({ type: 'int', nullable: false })
    rating: number;

    @Column({ type: 'text', nullable: true })
    comment: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @DeleteDateColumn()
    deletedAt: Date;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'landlordId' })
    landlord: User;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'reviewerId' })
    reviewer: User;

    @ManyToOne(() => Rental, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'rentalId' })
    rental: Rental;
}
