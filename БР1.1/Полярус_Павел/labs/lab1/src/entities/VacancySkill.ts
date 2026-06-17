import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Vacancy } from './Vacancy';
import { Skill } from './Skill';

@Entity('vacancy_skills')
export class VacancySkill {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  vacancy_id: string;

  @ManyToOne(() => Vacancy, (vacancy) => vacancy.vacancySkills, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'vacancy_id' })
  vacancy: Vacancy;

  @Column({ type: 'uuid' })
  skill_id: string;

  @ManyToOne(() => Skill, (skill) => skill.vacancySkills)
  @JoinColumn({ name: 'skill_id' })
  skill: Skill;
}
