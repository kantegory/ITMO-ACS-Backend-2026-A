import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    ManyToOne,
    OneToMany,
    JoinColumn,
    CreateDateColumn,
    UpdateDateColumn,
    BaseEntity,
} from 'typeorm';

import { BookingStatus } from './enums';
import { Property } from './property.entity';
import { User } from './user.entity';
import { Review } from './review.entity';

@Entity()
export class Booking extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Property, (property) => property.bookings, {
        nullable: false,
    })
    @JoinColumn({ name: 'propertyId' })
    property: Property;

    @Column({ type: 'int' })
    propertyId: number;

    @ManyToOne(() => User, (user) => user.bookings, { nullable: false })
    @JoinColumn({ name: 'tenantId' })
    tenant: User;

    @Column({ type: 'int' })
    tenantId: number;

    @Column({ type: 'date' })
    startDate: string;

    @Column({ type: 'date' })
    endDate: string;

    @Column({ type: 'float', default: 0 })
    totalPrice: number;

    @Column({ type: 'varchar', length: 20, default: BookingStatus.PENDING })
    status: BookingStatus;

    @OneToMany(() => Review, (review) => review.booking)
    reviews: Review[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
