import {
    Entity, Column, PrimaryGeneratedColumn, BaseEntity,
    ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, Index,
} from 'typeorm';
import { Rental } from './rental.entity';
import { TransactionType, TransactionStatus, PaymentMethod, CurrencyType } from './enums';
import { decimalTransformer } from '../utils/decimal-transformer';

@Entity('transactions')
export class Transaction extends BaseEntity {
    @PrimaryGeneratedColumn() id: number;
    @Index() @Column({ nullable: false }) rentalId: number;
    @Column({ type: 'varchar', nullable: true }) externalPaymentId: string;
    @Column({ type: 'enum', enum: TransactionType, nullable: false }) type: TransactionType;
    @Column({ type: 'decimal', precision: 12, scale: 2, nullable: false, transformer: decimalTransformer }) amount: number;
    @Column({ type: 'enum', enum: CurrencyType, nullable: false, default: CurrencyType.RUB }) currency: CurrencyType;
    @Index() @Column({ type: 'enum', enum: TransactionStatus, nullable: false, default: TransactionStatus.PENDING }) status: TransactionStatus;
    @Column({ type: 'enum', enum: PaymentMethod, nullable: false }) paymentMethod: PaymentMethod;
    @Column({ type: 'date', nullable: true }) periodStart: string;
    @Column({ type: 'date', nullable: true }) periodEnd: string;
    @Column({ type: 'timestamp', nullable: true }) paymentDate: Date;
    @CreateDateColumn() createdAt: Date;
    @UpdateDateColumn() updatedAt: Date;
    @DeleteDateColumn() deletedAt: Date;
    @ManyToOne(() => Rental, (r) => r.transactions, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'rentalId' }) rental: Rental;
}
