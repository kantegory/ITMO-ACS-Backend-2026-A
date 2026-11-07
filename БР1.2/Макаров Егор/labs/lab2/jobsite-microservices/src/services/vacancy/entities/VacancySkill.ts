import { Entity, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Vacancy } from './Vacancy';

@Entity('vacancy_skills')
export class VacancySkill {
  @PrimaryColumn({ name: 'vacancy_id' })
  vacancyId!: number;

  @PrimaryColumn({ name: 'skill_id' })
  skillId!: number;

  @ManyToOne(() => Vacancy, (v) => v.vacancySkills, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'vacancy_id' })
  vacancy!: Vacancy;
}
