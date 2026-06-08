import {
    Entity, Column, PrimaryGeneratedColumn, OneToMany,
    CreateDateColumn, UpdateDateColumn, BaseEntity,
} from 'typeorm';
import { Review } from './review.entity';

export enum BookingStatus {
    PENDING = 'pending',
    CONFIRMED = 'confirmed',
    ACTIVE = 'active',
    COMPLETED = 'completed',
    CANCELLED = 'cancelled',
}

@Entity()
export class Booking extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    // ссылки на сущности других сервисов — только id, без внешних ключей
    @Column({ type: 'int' })
    propertyId: number;

    @Column({ type: 'int' })
    tenantId: number;

    // владелец объекта (из Catalog) — нужен для событий (напр. открытие диалога)
    @Column({ type: 'int', nullable: true })
    ownerId: number | null;

    // денормализованный снимок данных объекта на момент сделки (из Catalog Service)
    @Column({ type: 'varchar', length: 200, nullable: true })
    propertyTitle: string | null;

    @Column({ type: 'date' })
    startDate: string;

    @Column({ type: 'date' })
    endDate: string;

    @Column({ type: 'float', default: 0 })
    totalPrice: number;

    @Column({ type: 'varchar', length: 20, default: BookingStatus.PENDING })
    status: BookingStatus;

    @OneToMany(() => Review, (r) => r.booking)
    reviews: Review[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
