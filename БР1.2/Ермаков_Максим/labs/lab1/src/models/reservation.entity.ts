import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { AppBaseEntity } from './base.entity';
import { ReservationStatus } from '../common/enums';
import { RestaurantTable } from './restaurant-table.entity';
import { Restaurant } from './restaurant.entity';
import { User } from './user.entity';

@Entity({ name: 'reservations' })
export class Reservation extends AppBaseEntity {
    @ManyToOne(() => User, (user) => user.reservations, {
        nullable: false,
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'userId' })
    user: User;

    @ManyToOne(() => Restaurant, (restaurant) => restaurant.reservations, {
        nullable: false,
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'restaurantId' })
    restaurant: Restaurant;

    @ManyToOne(() => RestaurantTable, (table) => table.reservations, {
        nullable: false,
        onDelete: 'RESTRICT',
    })
    @JoinColumn({ name: 'tableId' })
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
    comment?: string | null;

    @Column({ type: 'text', nullable: true })
    cancelReason?: string | null;
}
