import {BaseEntity, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique, Column} from 'typeorm';
import { Vacancy } from './vacancy.entity';

@Entity('vacancy_skills')
@Unique('uq_vacancy_skill', ['vacancy', 'skillId'])
export class VacancySkill extends BaseEntity {
    @PrimaryGeneratedColumn({ name: 'id' })
    id: number;

    @ManyToOne(() => Vacancy, (vacancy) => vacancy.vacancySkills, {onDelete: 'CASCADE'})
    @JoinColumn({ name: 'vacancy_id' })
    vacancy: Vacancy;

    @Column({ name: 'skill_id', type: 'int' })
    skillId: number;
}
