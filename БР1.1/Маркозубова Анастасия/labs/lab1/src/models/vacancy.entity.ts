import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    BaseEntity,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
    ManyToOne,
    JoinColumn,
} from 'typeorm';

import { Company } from './company.entity';
import { Specialization } from './specialization.entity';
import { Application } from './application.entity';

@Entity('vacancies')
export class Vacancy extends BaseEntity {
    @PrimaryGeneratedColumn()
    vacancy_id: number;

    @ManyToOne(() => Company, (company) => company.vacancies, {
        nullable: false,
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'company_id' })
    company: Company;

    @ManyToOne(() => Specialization, (specialization) => specialization.vacancies, {
        nullable: false,
    })
    @JoinColumn({ name: 'specialization_id' })
    specialization: Specialization;

    @Column({ type: 'varchar', length: 255, nullable: false })
    title: string;

    @Column({ type: 'text', nullable: false })
    description: string;

    @Column({ type: 'text', nullable: false })
    requirements: string;

    @Column({ type: 'integer', nullable: true })
    salary_min: number;

    @Column({ type: 'integer', nullable: true })
    salary_max: number;

    @Column({ type: 'integer', nullable: true })
    experience_required: number;

    @Column({ type: 'varchar', length: 255, nullable: true })
    location: string;

    @Column({ type: 'varchar', length: 20, nullable: true })
    work_format: string;

    @Column({ type: 'varchar', length: 30, nullable: true })
    employment_type: string;

    @Column({ type: 'varchar', length: 20, nullable: false, default: 'active' })
    status: string;

    @CreateDateColumn({ type: 'timestamp' })
    created_at: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updated_at: Date;

    @OneToMany(() => Application, (application) => application.vacancy)
    applications: Application[];
}
