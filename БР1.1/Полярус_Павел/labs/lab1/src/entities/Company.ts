import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  UpdateDateColumn,
} from 'typeorm';
import { Industry } from './Industry';
import { City } from './City';
import { Employer } from './Employer';
import { Vacancy } from './Vacancy';

@Entity('companies')
export class Company {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  industry_id: string | null;

  @ManyToOne(() => Industry, (industry) => industry.companies, { nullable: true })
  @JoinColumn({ name: 'industry_id' })
  industry: Industry | null;

  @Column({ type: 'uuid', nullable: true })
  city_id: string | null;

  @ManyToOne(() => City, (city) => city.companies, { nullable: true })
  @JoinColumn({ name: 'city_id' })
  city: City | null;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', nullable: true })
  website: string | null;

  @Column({ type: 'varchar', nullable: true })
  logo_url: string | null;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => Employer, (employer) => employer.company)
  employers: Employer[];

  @OneToMany(() => Vacancy, (vacancy) => vacancy.company)
  vacancies: Vacancy[];
}
