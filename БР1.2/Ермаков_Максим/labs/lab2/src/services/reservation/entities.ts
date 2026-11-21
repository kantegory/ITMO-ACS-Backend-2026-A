import { Column, Entity, ManyToOne, OneToMany } from 'typeorm';
import { AppBaseEntity } from '../../common/base.entity';
import { ReservationStatus } from '../../common/enums';

@Entity({ name: 'restaurant_tables' })
export class RestaurantTable extends AppBaseEntity {
    @Column({ type: 'uuid' })
    restaurantId: string;

    @Column({ type: 'varchar', length: 20 })
    tableNumber: string;

    @Column({ type: 'int' })
    capacity: number;

    @Column({ type: 'boolean', default: true })
    isActive: boolean;

    @OneToMany(() => Reservation, (reservation) => reservation.table)
    reservations: Reservation[];
}

@Entity({ name: 'reservations' })
export class Reservation extends AppBaseEntity {
    @Column({ type: 'uuid' })
    userId: string;

    @Column({ type: 'uuid' })
    restaurantId: string;

    @ManyToOne(() => RestaurantTable, (table) => table.reservations, {
        nullable: false,
        onDelete: 'RESTRICT',
    })
    table: RestaurantTable;

    @Column({
        type: 'enum',
        enum: ReservationStatus,
        default: ReservationStatus.PENDING,
    })
    status: ReservationStatus;

    @Column({ type: 'varchar', length: 10 })
    reservationDate: string;

    @Column({ type: 'varchar', length: 5 })
    reservationTime: string;

    @Column({ type: 'int' })
    guestsCount: number;

    @Column({ type: 'text', nullable: true })
    comment?: string;

    @Column({ type: 'text', nullable: true })
    cancelReason?: string;
}
