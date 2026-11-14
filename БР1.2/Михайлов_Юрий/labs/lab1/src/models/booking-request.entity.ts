import { BaseEntity, Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class BookingRequest extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'int', nullable: false })
    property_id: number;

    @Column({ type: 'int', nullable: false })
    tenant_id: number;

    @CreateDateColumn({ type: 'timestamptz' })
    creation_time: Date;

    @Column({ type: 'text', nullable: false })
    comments: string;
}

