import {
  Entity, PrimaryGeneratedColumn, Column, ManyToMany,
} from 'typeorm';
import { Resume } from './Resume';
import { Vacancy } from './Vacancy';

@Entity('skills')
export class Skill {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 100, unique: true })
  name!: string;

  @ManyToMany(() => Resume, (r) => r.skills)
  resumes?: Resume[];

  @ManyToMany(() => Vacancy, (v) => v.skills)
  vacancies?: Vacancy[];
}
