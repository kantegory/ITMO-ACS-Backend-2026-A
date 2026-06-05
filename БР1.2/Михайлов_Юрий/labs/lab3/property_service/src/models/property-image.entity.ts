import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class PropertyImage extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'int', nullable: false })
    property_id: number;

    @Column({ type: 'varchar', length: 1000, nullable: false })
    url: string;
}

