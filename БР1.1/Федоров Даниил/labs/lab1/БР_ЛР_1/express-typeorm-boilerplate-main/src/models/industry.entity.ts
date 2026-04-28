import {BaseEntity, Column, Entity, OneToMany, PrimaryGeneratedColumn,} from 'typeorm';
import { Vacancy } from './vacancy.entity';

@Entity('industries')
export class Industry extends BaseEntity {
    @PrimaryGeneratedColumn({ name: 'industry_id' })
    industryId: number;

    @Column({ type: 'varchar', length: 150, unique: true })
    name: string;

    @OneToMany(() => Vacancy, (vacancy) => vacancy.industry)
    vacancies: Vacancy[];
}