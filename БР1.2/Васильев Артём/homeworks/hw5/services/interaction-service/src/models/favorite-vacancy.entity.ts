import { Entity, Index, Column } from 'typeorm';
import { Expose } from 'class-transformer';

import { AuditedEntity } from '../common/audited.entity';

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

}
