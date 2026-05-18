import {BaseEntity, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique} from 'typeorm';
import { Vacancy } from './vacancy.entity';
import { Skill } from './skill.entity';

@Entity('vacancy_skills')
@Unique('uq_vacancy_skill', ['vacancy', 'skill'])
export class VacancySkill extends BaseEntity {
    @PrimaryGeneratedColumn({ name: 'id' })
    id: number;

    @ManyToOne(() => Vacancy, (vacancy) => vacancy.vacancySkills, {onDelete: 'CASCADE'})
    @JoinColumn({ name: 'vacancy_id' })
    vacancy: Vacancy;

    @ManyToOne(() => Skill, (skill) => skill.vacancySkills, {onDelete: 'CASCADE'})
    @JoinColumn({ name: 'skill_id' })
    skill: Skill;
}
