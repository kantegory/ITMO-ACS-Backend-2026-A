import {BaseEntity, Column, Entity, OneToMany, PrimaryGeneratedColumn, } from 'typeorm';
import { Vacancy } from './vacancy.entity';

@Entity('experience')
export class ExperienceOption extends BaseEntity {
    @PrimaryGeneratedColumn({name: 'experience_id'})
    experienceId: number;

    @Column({ type: 'varchar', length: 100, unique: true })
    period: string;

    @OneToMany(() => Vacancy, (vacancy) => vacancy.experience)
    vacancies: Vacancy[];

    


}
