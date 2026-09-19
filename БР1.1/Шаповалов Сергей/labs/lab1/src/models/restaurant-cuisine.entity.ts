import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    BaseEntity,
    ManyToOne,
    JoinColumn,
    Unique,
} from 'typeorm';
import { Restaurant } from './restaurant.entity';
import { CuisineType } from './cuisine-type.entity';

@Entity('restaurant_cuisines')
@Unique(['restaurantId', 'cuisineTypeId'])
export class RestaurantCuisine extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'restaurant_id', type: 'int' })
    restaurantId: number;

    @Column({ name: 'cuisine_type_id', type: 'int' })
    cuisineTypeId: number;

    @ManyToOne(() => Restaurant, (restaurant) => restaurant.restaurantCuisines, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'restaurant_id' })
    restaurant: Restaurant;

    @ManyToOne(
        () => CuisineType,
        (cuisineType) => cuisineType.restaurantCuisines,
        { onDelete: 'CASCADE' },
    )
    @JoinColumn({ name: 'cuisine_type_id' })
    cuisineType: CuisineType;
}
