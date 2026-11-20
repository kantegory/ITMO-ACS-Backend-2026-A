import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
import { RestaurantStatus, PriceCategory } from '../common/enums';

@Entity('restaurants')
export class Restaurant {
    @PrimaryGeneratedColumn()
    restaurant_id!: number;

    @Column({ type: 'varchar', length: 300, nullable: false })
    name!: string;

    @Column({ type: 'text', nullable: true })
    description!: string;

    @Column({ type: 'text', nullable: true })
    address!: string;

    @Column({ type: 'varchar', length: 150, nullable: true })
    city!: string;

    @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
    rating!: number;

    @Column({ type: 'enum', enum: PriceCategory, nullable: true })
    price!: PriceCategory;

    @Column({ type: 'enum', enum: RestaurantStatus, default: RestaurantStatus.Pending })
    status!: RestaurantStatus;
}
