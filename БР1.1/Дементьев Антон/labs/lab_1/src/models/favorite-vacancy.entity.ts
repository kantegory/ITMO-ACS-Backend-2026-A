import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    ManyToOne,
    JoinColumn,
    Unique,
    CreateDateColumn,
    BaseEntity,
} from 'typeorm';

import { User } from './user.entity';
import { Vacancy } from './vacancy.entity';

@Entity('favorite_vacancies')
@Unique(['userId', 'vacancyId'])
export class FavoriteVacancy extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'user_id', type: 'uuid' })
    userId: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({ name: 'vacancy_id', type: 'uuid' })
    vacancyId: string;

    @ManyToOne(() => Vacancy, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'vacancy_id' })
    vacancy: Vacancy;

    @CreateDateColumn()
    createdAt: Date;
}
