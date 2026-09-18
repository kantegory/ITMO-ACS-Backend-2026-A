import {BaseEntity, Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn,} from 'typeorm';
import { Employer } from './employer.entity';
import { ExperienceOption } from './experience-option.entity';
import { Industry } from './industry.entity';
import { VacancySkill } from './vacancy-skill.entity';
import { ApplicationResponse } from './response.entity';


@Entity('vacancies')
export class Vacancy extends BaseEntity {
    @PrimaryGeneratedColumn({name: 'vacancy_id'})
    vacancyId: number;

    @ManyToOne(() => Employer, (employer) => employer.vacancies, {onDelete: 'CASCADE'})
    @JoinColumn({name: 'employer_id'})
    employer: Employer;

    @ManyToOne(() => ExperienceOption, (experience) => experience.vacancies)
    @JoinColumn({name: 'experience_id'})
    experience: ExperienceOption;

    @ManyToOne(() => Industry, (industry) => industry.vacancies)
    @JoinColumn({name: 'industry_id'})
    industry: Industry;

    @Column({ type: 'varchar', length: 255 })
    title: string;

    @Column({ type: 'text' })
    description: string;

    @Column({ type: 'text' })
    requirements: string;

    @Column({ type: 'int' })
    salary: number;

    @Column({ type: 'varchar', length: 100 })
    city: string;

    @CreateDateColumn({name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP'})
    createdAt: Date;

    @OneToMany(() => VacancySkill, (vacancySkill) => vacancySkill.vacancy)
    vacancySkills: VacancySkill[];

    @OneToMany(() => ApplicationResponse, (response) => response.vacancy)
    responses: ApplicationResponse[];

}