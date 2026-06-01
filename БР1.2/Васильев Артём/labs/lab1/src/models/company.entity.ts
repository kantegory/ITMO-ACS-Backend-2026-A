import { Column, Entity, Index, OneToMany } from 'typeorm';
import { Expose } from 'class-transformer';

import { AuditedEntity } from '../common/audited.entity';
import { EmployerProfile } from './employer-profile.entity';
import { Vacancy } from './vacancy.entity';

@Entity({ name: 'companies' })
export class Company extends AuditedEntity {
    @Expose()
    @Index()
    @Column({ type: 'varchar', length: 255 })
    title: string;

    @Expose()
    @Column({ type: 'text', nullable: true })
    description?: string | null;

    @Expose()
    @Column({ type: 'varchar', length: 255, nullable: true })
    website?: string | null;

    @Expose({ name: 'industry_text' })
    @Column({
        name: 'industry_text',
        type: 'varchar',
        length: 255,
        nullable: true,
    })
    industryText?: string | null;

    @Expose()
    @Column({ type: 'varchar', length: 255, nullable: true })
    address?: string | null;

    @Expose({ name: 'employee_count' })
    @Column({ name: 'employee_count', type: 'integer', nullable: true })
    employeeCount?: number | null;

    @OneToMany(() => EmployerProfile, (profile) => profile.company)
    employerProfiles: EmployerProfile[];

    @OneToMany(() => Vacancy, (vacancy) => vacancy.company)
    vacancies: Vacancy[];
}
