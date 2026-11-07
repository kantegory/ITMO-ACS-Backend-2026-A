import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany,
} from 'typeorm';
import { EmploymentType, Schedule, VacancyStatus } from '../../../common/enums';
import { VacancySkill } from './VacancySkill';

@Entity('vacancies')
export class Vacancy {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'company_id' })
  companyId!: number;

  @Column({ type: 'int', name: 'employer_id', nullable: true })
  employerId?: number | null;

  // денормализованная копия отрасли компании — для локальной фильтрации без обращения к другим сервисам
  @Column({ type: 'int', name: 'industry_id', nullable: true })
  industryId?: number | null;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({ type: 'text', nullable: true })
  requirements?: string | null;

  @Column({ type: 'integer', nullable: true, name: 'salary_from' })
  salaryFrom?: number | null;

  @Column({ type: 'integer', nullable: true, name: 'salary_to' })
  salaryTo?: number | null;

  @Column({ type: 'varchar', length: 10, default: 'RUB' })
  currency!: string;

  @Column({ type: 'integer', nullable: true, name: 'experience_years' })
  experienceYears?: number | null;

  @Column({ type: 'enum', enum: EmploymentType, nullable: true, name: 'employment_type' })
  employmentType?: EmploymentType | null;

  @Column({ type: 'enum', enum: Schedule, nullable: true })
  schedule?: Schedule | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city?: string | null;

  @Column({ type: 'enum', enum: VacancyStatus, default: VacancyStatus.ACTIVE })
  status!: VacancyStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @OneToMany(() => VacancySkill, (vs) => vs.vacancy, { cascade: true })
  vacancySkills?: VacancySkill[];
}
