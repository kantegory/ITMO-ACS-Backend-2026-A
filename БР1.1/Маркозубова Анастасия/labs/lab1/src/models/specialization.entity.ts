import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    BaseEntity,
    OneToMany,
    ManyToOne,
    JoinColumn,
} from 'typeorm';

import { Industry } from './industry.entity';
import { Resume } from './resume.entity';
import { Vacancy } from './vacancy.entity';

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

    @OneToMany(() => Resume, (resume) => resume.specialization)
    resumes: Resume[];

    @OneToMany(() => Vacancy, (vacancy) => vacancy.specialization)
    vacancies: Vacancy[];
}
