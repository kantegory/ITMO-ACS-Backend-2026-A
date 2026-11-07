import {
  Entity, PrimaryColumn, Column, CreateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { JobSeeker } from './JobSeeker';
import { Vacancy } from './Vacancy';

@Entity('saved_vacancies')
export class SavedVacancy {
  @PrimaryColumn({ name: 'job_seeker_id' })
  jobSeekerId!: number;

  @PrimaryColumn({ name: 'vacancy_id' })
  vacancyId!: number;

  @ManyToOne(() => JobSeeker, (s) => s.savedVacancies, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'job_seeker_id' })
  jobSeeker!: JobSeeker;

  @ManyToOne(() => Vacancy, (v) => v.savedBy, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'vacancy_id' })
  vacancy!: Vacancy;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
