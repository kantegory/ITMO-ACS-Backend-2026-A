import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn, OneToMany, ManyToMany, JoinTable,
} from 'typeorm';
import { EmploymentType, Schedule, VacancyStatus } from './enums';
import { Company } from './Company';
import { Employer } from './Employer';
import { Skill } from './Skill';
import { Application } from './Application';
import { SavedVacancy } from './SavedVacancy';

@Entity('vacancies')
export class Vacancy {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Company, (c) => c.vacancies, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company!: Company;

  @Column({ name: 'company_id' })
  companyId!: number;

  @ManyToOne(() => Employer, (e) => e.vacancies, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'employer_id' })
  employer?: Employer | null;

  @Column({ name: 'employer_id', nullable: true })
  employerId?: number | null;

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

  @ManyToMany(() => Skill, (s) => s.vacancies)
  @JoinTable({
    name: 'vacancy_skills',
    joinColumn: { name: 'vacancy_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'skill_id', referencedColumnName: 'id' },
  })
  skills?: Skill[];

  @OneToMany(() => Application, (a) => a.vacancy)
  applications?: Application[];

  @OneToMany(() => SavedVacancy, (sv) => sv.vacancy)
  savedBy?: SavedVacancy[];
}
