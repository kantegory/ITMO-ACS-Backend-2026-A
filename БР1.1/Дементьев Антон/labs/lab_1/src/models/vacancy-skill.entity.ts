import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    ManyToOne,
    JoinColumn,
    Index,
    Unique,
    CreateDateColumn,
    BaseEntity,
} from 'typeorm';

import { Vacancy } from './vacancy.entity';
import { Skill } from './skill.entity';

@Entity('vacancy_skills')
@Unique(['vacancyId', 'skillId'])
export class VacancySkill extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'vacancy_id', type: 'uuid' })
    vacancyId: string;

    @ManyToOne(() => Vacancy, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'vacancy_id' })
    vacancy: Vacancy;

    @Index()
    @Column({ name: 'skill_id', type: 'uuid' })
    skillId: string;

    @ManyToOne(() => Skill, { onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'skill_id' })
    skill: Skill;

    @Column({ type: 'boolean', default: false })
    isRequired: boolean;

    @CreateDateColumn()
    createdAt: Date;
}
