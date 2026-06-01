import { Column, Entity, Index, OneToMany } from 'typeorm';
import { Expose } from 'class-transformer';

import { AuditedEntity } from '../common/audited.entity';
import { Vacancy } from './vacancy.entity';

@Entity({ name: 'industries' })
export class Industry extends AuditedEntity {
    @Expose()
    @Index({ unique: true })
    @Column({ type: 'varchar', length: 255 })
    title: string;

    @Expose({ name: 'is_published' })
    @Column({ name: 'is_published', type: 'boolean', default: true })
    isPublished: boolean;

    @OneToMany(() => Vacancy, (vacancy) => vacancy.industry)
    vacancies: Vacancy[];
}
