import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class PropertyAttributes extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'int', nullable: false, unique: true })
    property_id: number;

    @Column({ type: 'int', nullable: false })
    floor: number;

    @Column({ type: 'varchar', length: 50, nullable: false })
    building_type: string;

    @Column({ type: 'int', nullable: false })
    bathrooms_count: number;

    @Column({ type: 'bool', nullable: false })
    has_washing_machine: boolean;

    @Column({ type: 'varchar', length: 50, nullable: false })
    view_type: string;

    @Column({ type: 'bool', nullable: false })
    has_kitchen: boolean;
}

