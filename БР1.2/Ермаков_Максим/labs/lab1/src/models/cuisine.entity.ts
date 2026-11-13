import { Column, Entity, ManyToMany } from 'typeorm';
import { AppBaseEntity } from './base.entity';
import { Restaurant } from './restaurant.entity';

@Entity({ name: 'cuisines' })
export class Cuisine extends AppBaseEntity {
    @Column({ type: 'varchar', length: 100, unique: true })
    title: string;

    @ManyToMany(() => Restaurant, (restaurant) => restaurant.cuisines)
    restaurants: Restaurant[];
}
