import { Entity, Index, JoinColumn, ManyToOne, Column } from 'typeorm';
import { Expose } from 'class-transformer';

import { AuditedEntity } from '../common/audited.entity';
import { User } from './user.entity';
import { Vacancy } from './vacancy.entity';

@Entity({ name: 'favorite_vacancies' })
@Index(['userId', 'vacancyId'], { unique: true })
export class FavoriteVacancy extends AuditedEntity {
    @Expose({ name: 'user_id' })
    @Index()
    @Column({ name: 'user_id', type: 'uuid' })
    userId: string;

    @Expose({ name: 'vacancy_id' })
    @Index()
    @Column({ name: 'vacancy_id', type: 'uuid' })
    vacancyId: string;

    @ManyToOne(() => User, (user) => user.favoriteVacancies, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @ManyToOne(() => Vacancy, (vacancy) => vacancy.favorites, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'vacancy_id' })
    vacancy: Vacancy;
}
