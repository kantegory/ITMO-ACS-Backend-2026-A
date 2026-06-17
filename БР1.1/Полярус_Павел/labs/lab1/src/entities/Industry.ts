import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Company } from './Company';
import { Vacancy } from './Vacancy';

@Entity('industries')
export class Industry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  name: string;

  @OneToMany(() => Company, (company) => company.industry)
  companies: Company[];

  @OneToMany(() => Vacancy, (vacancy) => vacancy.industry)
  vacancies: Vacancy[];
}
