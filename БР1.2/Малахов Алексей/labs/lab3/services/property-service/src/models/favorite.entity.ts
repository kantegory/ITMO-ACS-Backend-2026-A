import {
    Entity, Column, PrimaryGeneratedColumn, BaseEntity,
    ManyToOne, JoinColumn, CreateDateColumn, Index,
} from 'typeorm';
import { Property } from './property.entity';

@Entity('favorites')
@Index(['userId', 'propertyId'], { unique: true })
export class Favorite extends BaseEntity {
    @PrimaryGeneratedColumn() id: number;
    @Index() @Column({ nullable: false }) userId: number;
    @Index() @Column({ nullable: false }) propertyId: number;
    @CreateDateColumn() createdAt: Date;
    @ManyToOne(() => Property, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'propertyId' }) property: Property;
}
