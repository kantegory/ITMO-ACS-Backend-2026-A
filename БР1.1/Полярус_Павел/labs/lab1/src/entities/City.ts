import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Country } from './Country';
import { JobSeeker } from './JobSeeker';
import { Company } from './Company';
import { Vacancy } from './Vacancy';

@Entity('cities')
export class City {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  country_id: string;

  @ManyToOne(() => Country, (country) => country.cities)
  @JoinColumn({ name: 'country_id' })
  country: Country;

  @Column({ type: 'varchar' })
  name: string;

  @OneToMany(() => JobSeeker, (seeker) => seeker.city)
  jobSeekers: JobSeeker[];

  @OneToMany(() => Company, (company) => company.city)
  companies: Company[];

  @OneToMany(() => Vacancy, (vacancy) => vacancy.city)
  vacancies: Vacancy[];
}
