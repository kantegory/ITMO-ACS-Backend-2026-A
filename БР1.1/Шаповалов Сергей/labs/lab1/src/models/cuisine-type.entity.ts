import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    BaseEntity,
    OneToMany,
} from 'typeorm';
import { RestaurantCuisine } from './restaurant-cuisine.entity';

@Entity('cuisine_types')
export class CuisineType extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 100, unique: true })
    name: string;

    @OneToMany(
        () => RestaurantCuisine,
        (restaurantCuisine) => restaurantCuisine.cuisineType,
    )
    restaurantCuisines: RestaurantCuisine[];
}
