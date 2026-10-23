import { BaseEntity, Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { Vacancy } from './vacancy.entity';

@Entity('vacancy_skills')
@Unique(['vacancyId', 'skillId'])
export class VacancySkill extends BaseEntity {
    @PrimaryGeneratedColumn('uuid') id: string;
    @Column({ name: 'vacancy_id', type: 'uuid' }) vacancyId: string;
    @ManyToOne(() => Vacancy, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'vacancy_id' }) vacancy: Vacancy;
    @Index() @Column({ name: 'skill_id', type: 'uuid' }) skillId: string;
    @Column({ type: 'boolean', default: false }) isRequired: boolean;
    @CreateDateColumn() createdAt: Date;
}
