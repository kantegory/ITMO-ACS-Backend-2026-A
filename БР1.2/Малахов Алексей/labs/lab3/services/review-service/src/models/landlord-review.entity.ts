import {
    Entity, Column, PrimaryGeneratedColumn, BaseEntity,
    CreateDateColumn, UpdateDateColumn, DeleteDateColumn, Index,
} from 'typeorm';

@Entity('landlord_reviews')
@Index(['rentalId', 'reviewerId'], { unique: true })
export class LandlordReview extends BaseEntity {
    @PrimaryGeneratedColumn() id: number;
    @Index() @Column({ nullable: false }) landlordId: number;
    @Index() @Column({ nullable: false }) reviewerId: number;
    @Column({ nullable: false }) rentalId: number;
    @Column({ type: 'int', nullable: false }) rating: number;
    @Column({ type: 'text', nullable: true }) comment: string;
    @CreateDateColumn() createdAt: Date;
    @UpdateDateColumn() updatedAt: Date;
    @DeleteDateColumn() deletedAt: Date;
}
