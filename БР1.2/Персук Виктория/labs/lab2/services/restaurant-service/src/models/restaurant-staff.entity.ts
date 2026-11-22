import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

// user_id references auth_db — no ORM relation
@Entity('restaurant_staff')
export class RestaurantStaff {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: 'int' })
    user_id!: number;

    @Column({ type: 'int' })
    restaurant_id!: number;
}
