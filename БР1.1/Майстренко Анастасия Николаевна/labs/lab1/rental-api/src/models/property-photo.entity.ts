import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    BaseEntity,
} from 'typeorm';

import { Property } from './property.entity';

@Entity()
export class PropertyPhoto extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Property, (property) => property.photos, {
        nullable: false,
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'propertyId' })
    property: Property;

    @Column({ type: 'int' })
    propertyId: number;

    @Column({ type: 'varchar', length: 500 })
    url: string;

    @Column({ type: 'int', default: 0 })
    ordering: number;

    @CreateDateColumn()
    uploadedAt: Date;
}
