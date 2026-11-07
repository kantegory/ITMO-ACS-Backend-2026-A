import {
    Column,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    OneToMany,
} from 'typeorm';
import { Expose } from 'class-transformer';

import { AuditedEntity } from '../common/audited.entity';
import { User } from './user.entity';
import { Company } from './company.entity';
import { Vacancy } from './vacancy.entity';

@Entity({ name: 'employer_profiles' })
@Index(['userId', 'companyId'], { unique: true })
export class EmployerProfile extends AuditedEntity {
    @Expose({ name: 'user_id' })
    @Column({ name: 'user_id', type: 'uuid' })
    userId: string;

    @Expose({ name: 'company_id' })
    @Column({ name: 'company_id', type: 'uuid' })
    companyId: string;

    @Expose()
    @Column({ type: 'varchar', length: 255 })
    position: string;

    @ManyToOne(() => User, (user) => user.employerProfiles, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @ManyToOne(() => Company, (company) => company.employerProfiles, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'company_id' })
    company: Company;

    @OneToMany(() => Vacancy, (vacancy) => vacancy.employerProfile)
    vacancies: Vacancy[];
}
