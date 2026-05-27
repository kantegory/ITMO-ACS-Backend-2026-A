import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    BaseEntity,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';

@Entity('vacancies')
export class Vacancy extends BaseEntity {
    @PrimaryGeneratedColumn()
    vacancy_id: number;

    @Column({ type: 'integer', nullable: false })
    company_id: number;

    @Column({ type: 'integer', nullable: false })
    specialization_id: number;

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
}
