import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';
import { ReservationStatus } from '../common/enums';
import { User } from './user.entity';
import { Table } from './table.entity';

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

    @ManyToOne(() => User)
    @JoinColumn({ name: 'user_id' })
    user!: User;

    @ManyToOne(() => Table)
    @JoinColumn({ name: 'table_id' })
    table!: Table;
}
