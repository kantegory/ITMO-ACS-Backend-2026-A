import {
    Entity, Column, PrimaryGeneratedColumn, BaseEntity,
    ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Index,
} from 'typeorm';
import { Property } from './property.entity';

@Entity('property_photos')
export class PropertyPhoto extends BaseEntity {
    @PrimaryGeneratedColumn() id: number;
    @Index() @Column({ nullable: false }) propertyId: number;
    @Column({ type: 'varchar', nullable: false }) url: string;
    @Column({ type: 'boolean', nullable: false, default: false }) isMain: boolean;
    @Column({ type: 'int', nullable: true }) sortOrder: number;
    @CreateDateColumn() createdAt: Date;
    @UpdateDateColumn() updatedAt: Date;
    @ManyToOne(() => Property, (p) => p.photos, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'propertyId' }) property: Property;
}
