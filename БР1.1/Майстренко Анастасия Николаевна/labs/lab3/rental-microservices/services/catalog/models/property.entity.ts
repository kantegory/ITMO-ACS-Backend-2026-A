import {
    Entity, Column, PrimaryGeneratedColumn, ManyToMany, JoinTable,
    CreateDateColumn, UpdateDateColumn, BaseEntity,
} from 'typeorm';
import { Amenity } from './amenity.entity';

export enum PropertyType {
    APARTMENT = 'apartment',
    HOUSE = 'house',
    ROOM = 'room',
    STUDIO = 'studio',
}

export enum PropertyStatus {
    AVAILABLE = 'available',
    RENTED = 'rented',
    HIDDEN = 'hidden',
}

@Entity()
export class Property extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    // ссылка на пользователя из Identity Service — только id, без внешнего ключа
    @Column({ type: 'int' })
    ownerId: number;

    @Column({ type: 'varchar', length: 200 })
    title: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ type: 'varchar', length: 20 })
    propertyType: PropertyType;

    @Column({ type: 'float', default: 0 })
    pricePerDay: number;

    @Column({ type: 'varchar', length: 150 })
    city: string;

    @Column({ type: 'varchar', length: 300, nullable: true })
    address: string;

    @Column({ type: 'int', nullable: true })
    rooms: number;

    @Column({ type: 'varchar', length: 20, default: PropertyStatus.AVAILABLE })
    status: PropertyStatus;

    @ManyToMany(() => Amenity, (a) => a.properties)
    @JoinTable({ name: 'property_amenity' })
    amenities: Amenity[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
