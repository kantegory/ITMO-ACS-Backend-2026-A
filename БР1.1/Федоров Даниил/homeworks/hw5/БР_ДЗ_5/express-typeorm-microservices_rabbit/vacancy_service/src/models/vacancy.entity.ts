import {BaseEntity, Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn} from 'typeorm';

import { VacancySkill } from './vacancy-skill.entity';


@Entity('vacancies')
export class Vacancy extends BaseEntity {

    @PrimaryGeneratedColumn({name: 'vacancy_id',})
    vacancyId: number;


    @Column({name: 'employer_id',type: 'int'})
    employerId: number;


    @Column({name: 'experience_id',type: 'int'})
    experienceId: number;


    @Column({name: 'industry_id',type: 'int'})
    industryId: number;


    @Column({type: 'varchar',length: 255})
    title: string;


    @Column({type: 'text'})
    description: string;


    @Column({type: 'text',})
    requirements: string;


    @Column({type: 'int'})
    salary: number;


    @Column({type: 'varchar',length: 100})
    city: string;


    @CreateDateColumn({name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP'})
    createdAt: Date;


    @OneToMany(() => VacancySkill, (vacancySkill) => vacancySkill.vacancy,)
    vacancySkills: VacancySkill[];
}