import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    OneToMany,
    ManyToMany,
    JoinTable,
    CreateDateColumn,
    UpdateDateColumn,
    BaseEntity,
} from 'typeorm';

import { UserRole } from './enums';
import { Property } from './property.entity';
import { Booking } from './booking.entity';

@Entity()
export class User extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 300, unique: true, nullable: false })
    email: string;

    @Column({ type: 'varchar', length: 150, nullable: false })
    password: string;

    @Column({ type: 'varchar', length: 150, nullable: false })
    firstName: string;

    @Column({ type: 'varchar', length: 150, nullable: false })
    lastName: string;

    @Column({ type: 'varchar', length: 30, unique: true, nullable: true })
    phone: string | null;

    @Column({ type: 'varchar', length: 500, nullable: true })
    avatarUrl: string | null;

    @Column({ type: 'varchar', length: 20, default: UserRole.TENANT })
    role: UserRole;

    @Column({ type: 'boolean', default: false })
    isVerified: boolean;

    @OneToMany(() => Property, (property) => property.owner)
    properties: Property[];

    @OneToMany(() => Booking, (booking) => booking.tenant)
    bookings: Booking[];

    @ManyToMany(() => Property, (property) => property.favoritedBy)
    @JoinTable({ name: 'favorite' })
    favorites: Property[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
