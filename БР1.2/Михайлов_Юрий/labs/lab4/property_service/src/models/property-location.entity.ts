import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class PropertyLocation extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'int', nullable: false, unique: true })
    property_id: number;

    @Column({ type: 'varchar', length: 500, nullable: false })
    address: string;

    @Column({ type: 'varchar', length: 100, nullable: false })
    city: string;

    @Column({ type: 'varchar', length: 100, nullable: false })
    country: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    metro_station?: string | null;

    @Column({ type: 'float8', nullable: false })
    latitude: number;

    @Column({ type: 'float8', nullable: false })
    longitude: number;
}

