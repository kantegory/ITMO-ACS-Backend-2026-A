import {
    Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn,
    CreateDateColumn, UpdateDateColumn,
} from 'typeorm';
import { ReservationStatus } from '../common/enums';
import { Table } from './table.entity';

// user_id references auth_db — no ORM relation
@Entity('reservations')
export class Reservation {
    @PrimaryGeneratedColumn()
    reservation_id!: number;

    @Column({ type: 'int' })
    user_id!: number;

    @Column({ type: 'int' })
    table_id!: number;

    @Column({ type: 'timestamp' })
    start_time!: Date;

    @Column({ type: 'timestamp' })
    end_time!: Date;

    @Column({ type: 'enum', enum: ReservationStatus, default: ReservationStatus.Pending })
    status!: ReservationStatus;

    @Column({ type: 'integer' })
    guest_number!: number;

    @CreateDateColumn()
    created_at!: Date;

    @UpdateDateColumn()
    edited_at!: Date;

    @ManyToOne(() => Table)
    @JoinColumn({ name: 'table_id' })
    table!: Table;
}
