import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Vacancy } from './Vacancy';

@Entity('employment_types')
export class EmploymentType {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  name: string;

  @OneToMany(() => Vacancy, (vacancy) => vacancy.employmentType)
  vacancies: Vacancy[];
}
