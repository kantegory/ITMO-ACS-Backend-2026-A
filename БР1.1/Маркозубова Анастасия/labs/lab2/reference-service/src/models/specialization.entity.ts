import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    BaseEntity,
    ManyToOne,
    JoinColumn,
} from 'typeorm';

import { Industry } from './industry.entity';

@Entity('specializations')
export class Specialization extends BaseEntity {
    @PrimaryGeneratedColumn()
    specialization_id: number;

    @ManyToOne(() => Industry, (industry) => industry.specializations, {
        nullable: false,
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'industry_id' })
    industry: Industry;

    @Column({ type: 'varchar', length: 255, nullable: false })
    name: string;
}
