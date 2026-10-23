import { BaseEntity, Column, CreateDateColumn, Entity, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';

// Копия данных для подбора: заполняется событиями vacancy.* / resume.* и выгрузкой (POST /internal/v1/index/rebuild)
@Entity('vacancy_index')
export class VacancyIndex extends BaseEntity {
    @PrimaryColumn({ type: 'uuid' }) vacancyId: string;
    @Column({ type: 'uuid' }) industryId: string;
    @Column({ type: 'int', nullable: true }) salaryFrom: number | null;
    @Column({ type: 'int', nullable: true }) salaryTo: number | null;
    @Column({ type: 'int', default: 0 }) minExperienceYears: number;
    @Column({ type: 'boolean', default: true }) isActive: boolean;
    @Column({ type: 'timestamp' }) sourceCreatedAt: Date;
    @Column({ type: 'timestamp' }) sourceUpdatedAt: Date;
}
@Entity('vacancy_skill_index')
export class VacancySkillIndex extends BaseEntity {
    @PrimaryColumn({ type: 'uuid' }) vacancyId: string;
    @PrimaryColumn({ type: 'uuid' }) skillId: string;
    @Column({ type: 'boolean', default: false }) isRequired: boolean;
}
@Entity('resume_index')
export class ResumeIndex extends BaseEntity {
    @PrimaryColumn({ type: 'uuid' }) resumeId: string;
    @Column({ type: 'uuid' }) userId: string;
    @Column({ type: 'uuid' }) industryId: string;
    @Column({ type: 'int', nullable: true }) salaryExpFrom: number | null;
    @Column({ type: 'int', nullable: true }) salaryExpTo: number | null;
    @Column({ type: 'jsonb', default: () => "'[]'" }) experiencePeriods: { start_date: string; end_date: string | null }[];
    @Column({ type: 'timestamp' }) sourceUpdatedAt: Date;
}
@Entity('resume_skill_index')
export class ResumeSkillIndex extends BaseEntity {
    @PrimaryColumn({ type: 'uuid' }) resumeId: string;
    @PrimaryColumn({ type: 'uuid' }) skillId: string;
}
@Entity('index_jobs')
export class IndexJob extends BaseEntity {
    @PrimaryGeneratedColumn('uuid') id: string;
    @Column({ type: 'varchar', length: 20 }) scope: string;
    @Column({ type: 'varchar', length: 20 }) status: string;
    @Column({ type: 'int', default: 0 }) processedItems: number;
    @CreateDateColumn() startedAt: Date;
    @Column({ type: 'timestamp', nullable: true }) finishedAt: Date | null;
}
