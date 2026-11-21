import { Column, Entity, JoinColumn, ManyToOne, OneToMany, Unique } from 'typeorm';
import { AppBaseEntity } from './base.entity';
import { Reservation } from './reservation.entity';
import { Restaurant } from './restaurant.entity';

@Entity({ name: 'restaurant_tables' })
@Unique(['restaurant', 'tableNumber'])
export class RestaurantTable extends AppBaseEntity {
    @Column({ type: 'varchar', length: 20 })
    tableNumber: string;

    @Column({ type: 'int' })
    capacity: number;

    @Column({ type: 'boolean', default: true })
    isActive: boolean;

    @ManyToOne(() => Restaurant, (restaurant) => restaurant.tables, {
        nullable: false,
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'restaurantId' })
    restaurant: Restaurant;

    @OneToMany(() => Reservation, (reservation) => reservation.table)
    reservations: Reservation[];
}
