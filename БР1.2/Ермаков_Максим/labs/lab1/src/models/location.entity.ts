import { Column, Entity, OneToMany, Unique } from 'typeorm';
import { AppBaseEntity } from './base.entity';
import { Restaurant } from './restaurant.entity';

@Entity({ name: 'locations' })
@Unique(['city', 'address', 'district', 'metroStation'])
export class Location extends AppBaseEntity {
    @Column({ type: 'varchar', length: 100 })
    city: string;

    @Column({ type: 'varchar', length: 255 })
    address: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    district?: string | null;

    @Column({ type: 'varchar', length: 100, nullable: true })
    metroStation?: string | null;

    @OneToMany(() => Restaurant, (restaurant) => restaurant.location)
    restaurants: Restaurant[];
}
