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
import { Company } from './Company';
import { VacancySkill } from './VacancySkill';

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

  @Column({ type: 'uuid' })
  company_id: string;

  @ManyToOne(() => Company, (c) => c.vacancies)
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @Column({ type: 'uuid', nullable: true })
  industry_id: string | null;

  @Column({ type: 'uuid', nullable: true })
  city_id: string | null;

  @Column({ type: 'uuid', nullable: true })
  employment_type_id: string | null;

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
}
