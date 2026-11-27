import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Payment extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'int', nullable: false })
    booking_id: number;

    @Column({ type: 'float8', nullable: false })
    amount: number;

    @Column({ type: 'varchar', length: 50, nullable: false })
    status: string;
}

