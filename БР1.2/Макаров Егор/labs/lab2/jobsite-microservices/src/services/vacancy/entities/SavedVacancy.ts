import { Entity, PrimaryColumn, CreateDateColumn } from 'typeorm';

@Entity('saved_vacancies')
export class SavedVacancy {
  @PrimaryColumn({ name: 'job_seeker_id' })
  jobSeekerId!: number;

  @PrimaryColumn({ name: 'vacancy_id' })
  vacancyId!: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
