import { BaseEntity, Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { Vacancy } from './vacancy.entity';

@Entity('favorite_vacancies')
@Unique(['userId', 'vacancyId'])
export class FavoriteVacancy extends BaseEntity {
    @PrimaryGeneratedColumn('uuid') id: string;
    @Column({ name: 'user_id', type: 'uuid' }) userId: string;
    @Column({ name: 'vacancy_id', type: 'uuid' }) vacancyId: string;
    @ManyToOne(() => Vacancy, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'vacancy_id' }) vacancy: Vacancy;
    @CreateDateColumn() createdAt: Date;
}
