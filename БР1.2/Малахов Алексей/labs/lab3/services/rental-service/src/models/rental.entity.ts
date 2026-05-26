import {
    Entity, Column, PrimaryGeneratedColumn, BaseEntity,
    CreateDateColumn, UpdateDateColumn, OneToMany, Index,
} from 'typeorm';
import { RentalStatus, CurrencyType, DepositStatus } from './enums';
import { Transaction } from './transaction.entity';
import { decimalTransformer } from '../utils/decimal-transformer';

@Entity('rentals')
@Index(['propertyId', 'status'])
export class Rental extends BaseEntity {
    @PrimaryGeneratedColumn() id: number;
    @Index() @Column({ nullable: false }) propertyId: number;
    @Index() @Column({ nullable: false }) renterId: number;
    @Column({ nullable: false }) ownerId: number;
    @Column({ type: 'decimal', precision: 12, scale: 2, nullable: false, transformer: decimalTransformer }) agreedPrice: number;
    @Column({ type: 'enum', enum: CurrencyType, nullable: false, default: CurrencyType.RUB }) currency: CurrencyType;
    @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true, transformer: decimalTransformer }) depositAmount: number;
    @Column({ type: 'enum', enum: DepositStatus, nullable: true }) depositStatus: DepositStatus;
    @Column({ type: 'timestamp', nullable: true }) depositReturnedAt: Date;
    @Column({ type: 'date', nullable: false }) startDate: string;
    @Column({ type: 'date', nullable: true }) endDate: string;
    @Index() @Column({ type: 'enum', enum: RentalStatus, nullable: false, default: RentalStatus.PENDING }) status: RentalStatus;
    @Column({ type: 'timestamp', nullable: true }) cancelledAt: Date;
    @Column({ type: 'text', nullable: true }) cancelReason: string;
    @CreateDateColumn() createdAt: Date;
    @UpdateDateColumn() updatedAt: Date;
    @OneToMany(() => Transaction, (t) => t.rental) transactions: Transaction[];
}
