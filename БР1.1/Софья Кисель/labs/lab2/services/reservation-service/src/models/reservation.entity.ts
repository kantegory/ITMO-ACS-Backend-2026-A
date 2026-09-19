import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';

import { ReservationStatus } from '../common/enums';

@Entity('reservations')
export class Reservation {
    @PrimaryGeneratedColumn()
    reservation_id!: number;

    @Column({ type: 'int' })
    user_id!: number;

    @Column({ type: 'int' })
    table_id!: number;

    @Column({ type: 'timestamp' })
    reservation_time!: Date;

    @Column({ type: 'timestamp' })
    reservation_date!: Date;

    @Column({
        type: 'enum',
        enum: ReservationStatus,
        default: ReservationStatus.Pending,
    })
    status!: ReservationStatus;

    @Column({ type: 'integer' })
    guest_number!: number;

    @CreateDateColumn()
    created_at!: Date;

    @UpdateDateColumn()
    edited_at!: Date;
}
