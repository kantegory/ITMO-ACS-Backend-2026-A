import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    BaseEntity,
    OneToMany,
} from 'typeorm';

import { Specialization } from './specialization.entity';

@Entity('industries')
export class Industry extends BaseEntity {
    @PrimaryGeneratedColumn()
    industry_id: number;

    @Column({ type: 'varchar', length: 255, nullable: false })
    name: string;

    @OneToMany(() => Specialization, (specialization) => specialization.industry)
    specializations: Specialization[];
}
