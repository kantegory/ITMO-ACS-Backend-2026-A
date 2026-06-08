import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    ManyToOne,
    OneToMany,
    ManyToMany,
    JoinTable,
    JoinColumn,
    CreateDateColumn,
    UpdateDateColumn,
    BaseEntity,
} from 'typeorm';

import { PropertyType, PropertyStatus } from './enums';
import { User } from './user.entity';
import { PropertyPhoto } from './property-photo.entity';
import { Amenity } from './amenity.entity';
import { Booking } from './booking.entity';

@Entity()
export class Property extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => User, (user) => user.properties, { nullable: false })
    @JoinColumn({ name: 'ownerId' })
    owner: User;

    @Column({ type: 'int' })
    ownerId: number;

    @Column({ type: 'varchar', length: 200, nullable: false })
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

    @Column({ type: 'float', nullable: true })
    latitude: number;

    @Column({ type: 'float', nullable: true })
    longitude: number;

    @Column({ type: 'float', nullable: true })
    area: number;

    @Column({ type: 'int', nullable: true })
    rooms: number;

    @Column({ type: 'varchar', length: 20, default: PropertyStatus.AVAILABLE })
    status: PropertyStatus;

    @OneToMany(() => PropertyPhoto, (photo) => photo.property)
    photos: PropertyPhoto[];

    @ManyToMany(() => Amenity, (amenity) => amenity.properties)
    @JoinTable({ name: 'property_amenity' })
    amenities: Amenity[];

    @OneToMany(() => Booking, (booking) => booking.property)
    bookings: Booking[];

    @ManyToMany(() => User, (user) => user.favorites)
    favoritedBy: User[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
