import { Column, Entity, Index, OneToMany } from 'typeorm';
import { Expose } from 'class-transformer';

import { AuditedEntity } from '../common/audited.entity';
import { Vacancy } from './vacancy.entity';

@Entity({ name: 'experience_levels' })
export class ExperienceLevel extends AuditedEntity {
    @Expose()
    @Index({ unique: true })
    @Column({ type: 'varchar', length: 255 })
    title: string;

    @Expose({ name: 'min_experience_months' })
    @Column({ name: 'min_experience_months', type: 'integer' })
    minExperienceMonths: number;

    @Expose({ name: 'max_experience_months' })
    @Column({ name: 'max_experience_months', type: 'integer' })
    maxExperienceMonths: number;

    @Expose({ name: 'is_published' })
    @Column({ name: 'is_published', type: 'boolean', default: true })
    isPublished: boolean;

    @OneToMany(() => Vacancy, (vacancy) => vacancy.experienceLevel)
    vacancies: Vacancy[];
}
