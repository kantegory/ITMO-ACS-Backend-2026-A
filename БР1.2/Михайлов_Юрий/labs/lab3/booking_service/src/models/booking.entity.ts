import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Booking extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'int', nullable: false })
    property_id: number;

    @Column({ type: 'int', nullable: false })
    tenant_id: number;

    @Column({ type: 'date', nullable: false })
    start_date: string;

    @Column({ type: 'date', nullable: false })
    end_date: string;

    @Column({ type: 'varchar', length: 50, nullable: false })
    status: string;

    @Column({ type: 'text', nullable: false })
    details: string;
}

