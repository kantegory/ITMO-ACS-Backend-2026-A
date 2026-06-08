import { Entity, Column, PrimaryGeneratedColumn, ManyToMany, BaseEntity } from 'typeorm';
import { Property } from './property.entity';

@Entity()
export class Amenity extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 100, unique: true })
    name: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    icon: string | null;

    @ManyToMany(() => Property, (p) => p.amenities)
    properties: Property[];
}
