import { Column, Entity, Index } from 'typeorm';
import { Expose } from 'class-transformer';

import { AuditedEntity } from '../common/audited.entity';
import { numericTransformer } from '../common/column-transformers';
import { EmploymentType } from './enums/employment-type.enum';
import { WorkFormat } from './enums/work-format.enum';

@Entity({ name: 'vacancies' })
export class Vacancy extends AuditedEntity {
    @Expose({ name: 'company_id' })
    @Index()
    @Column({ name: 'company_id', type: 'uuid' })
    companyId: string;

    @Expose({ name: 'employer_profile_id' })
    @Index()
    @Column({ name: 'employer_profile_id', type: 'uuid' })
    employerProfileId: string;

    @Expose({ name: 'industry_id' })
    @Index()
    @Column({ name: 'industry_id', type: 'uuid' })
    industryId: string;

    @Expose({ name: 'experience_level_id' })
    @Index()
    @Column({ name: 'experience_level_id', type: 'uuid' })
    experienceLevelId: string;

    @Expose()
    @Index()
    @Column({ type: 'varchar', length: 255 })
    title: string;

    @Expose()
    @Column({ type: 'text' })
    description: string;

    @Expose()
    @Column({ type: 'text' })
    requirements: string;

    @Expose()
    @Column({ type: 'text' })
    responsibilities: string;

    @Expose({ name: 'salary_from' })
    @Column({
        name: 'salary_from',
        type: 'numeric',
        precision: 12,
        scale: 2,
        transformer: numericTransformer,
    })
    salaryFrom: number;

    @Expose({ name: 'salary_to' })
    @Column({
        name: 'salary_to',
        type: 'numeric',
        precision: 12,
        scale: 2,
        transformer: numericTransformer,
    })
    salaryTo: number;

    @Expose()
    @Index()
    @Column({ type: 'varchar', length: 255 })
    city: string;

    @Expose({ name: 'employment_type' })
    @Column({
        name: 'employment_type',
        type: 'enum',
        enum: EmploymentType,
    })
    employmentType: EmploymentType;

    @Expose({ name: 'work_format' })
    @Column({
        name: 'work_format',
        type: 'enum',
        enum: WorkFormat,
    })
    workFormat: WorkFormat;

    @Expose({ name: 'is_published' })
    @Index()
    @Column({ name: 'is_published', type: 'boolean', default: false })
    isPublished: boolean;

}
