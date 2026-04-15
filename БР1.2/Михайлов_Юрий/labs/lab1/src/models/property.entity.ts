import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Property extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 300, nullable: false })
    title: string;

    @Column({ type: 'text', nullable: false })
    description: string;

    @Column({ type: 'float8', nullable: false })
    price_per_month: number;

    @Column({ type: 'float4', nullable: false })
    square: number;

    @Column({ type: 'varchar', length: 50, nullable: false })
    type: string;

    @Column({ type: 'int', nullable: false })
    owner_id: number;
}

