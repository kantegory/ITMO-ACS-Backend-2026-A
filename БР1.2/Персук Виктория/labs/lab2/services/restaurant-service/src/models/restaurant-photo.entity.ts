import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('restaurant_photos')
export class RestaurantPhoto {
    @PrimaryGeneratedColumn()
    photo_id!: number;

    @Column({ type: 'int' })
    restaurant_id!: number;

    @Column({ type: 'text', nullable: false })
    url!: string;
}
