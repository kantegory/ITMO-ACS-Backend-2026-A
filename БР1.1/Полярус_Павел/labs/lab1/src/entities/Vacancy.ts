import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Employer } from './Employer';
import { Company } from './Company';
import { Industry } from './Industry';
import { City } from './City';
import { EmploymentType } from './EmploymentType';
import { VacancySkill } from './VacancySkill';
import { Application } from './Application';

export enum SalaryType {
  FIXED = 'FIXED',
  RANGE = 'RANGE',
  FROM = 'FROM',
  TO = 'TO',
  NEGOTIABLE = 'NEGOTIABLE',
}

@Entity('vacancies')
export class Vacancy {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  employer_id: string;

  @ManyToOne(() => Employer, (employer) => employer.vacancies)
  @JoinColumn({ name: 'employer_id' })
  employer: Employer;

  @Column({ type: 'uuid' })
  company_id: string;

  @ManyToOne(() => Company, (company) => company.vacancies)
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @Column({ type: 'uuid', nullable: true })
  industry_id: string | null;

  @ManyToOne(() => Industry, (industry) => industry.vacancies, { nullable: true })
  @JoinColumn({ name: 'industry_id' })
  industry: Industry | null;

  @Column({ type: 'uuid', nullable: true })
  city_id: string | null;

  @ManyToOne(() => City, (city) => city.vacancies, { nullable: true })
  @JoinColumn({ name: 'city_id' })
  city: City | null;

  @Column({ type: 'uuid', nullable: true })
  employment_type_id: string | null;

  @ManyToOne(() => EmploymentType, (et) => et.vacancies, { nullable: true })
  @JoinColumn({ name: 'employment_type_id' })
  employmentType: EmploymentType | null;

  @Column({ type: 'varchar' })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'text', nullable: true })
  conditions: string | null;

  @Column({ type: 'varchar', nullable: true })
  requirements_note: string | null;

  @Column({ type: 'enum', enum: SalaryType })
  salary_type: SalaryType;

  @Column({ type: 'int', nullable: true })
  salary_fixed: number | null;

  @Column({ type: 'int', nullable: true })
  salary_min: number | null;

  @Column({ type: 'int', nullable: true })
  salary_max: number | null;

  @Column({ type: 'varchar', default: 'RUB' })
  currency: string;

  @Column({ type: 'int', nullable: true })
  experience_years_min: number | null;

  @Column({ type: 'int', nullable: true })
  experience_years_max: number | null;

  @Column({ type: 'boolean', default: false })
  is_remote: boolean;

  @Column({ type: 'boolean', default: false })
  is_published: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => VacancySkill, (vs) => vs.vacancy, { cascade: true })
  vacancySkills: VacancySkill[];

  @OneToMany(() => Application, (app) => app.vacancy)
  applications: Application[];
}
