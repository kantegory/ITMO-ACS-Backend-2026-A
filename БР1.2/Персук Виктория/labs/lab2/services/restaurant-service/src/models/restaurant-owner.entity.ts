import { Entity, PrimaryColumn } from 'typeorm';

// user_id references auth_db — no ORM relation
@Entity('restaurant_owners')
export class RestaurantOwner {
    @PrimaryColumn({ type: 'int' })
    user_id!: number;

    @PrimaryColumn({ type: 'int' })
    restaurant_id!: number;
}
