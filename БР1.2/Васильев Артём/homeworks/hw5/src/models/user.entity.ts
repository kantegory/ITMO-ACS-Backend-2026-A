import { Column, Entity, Index, OneToMany } from 'typeorm';
import { Exclude, Expose } from 'class-transformer';

import { AuditedEntity } from '../common/audited.entity';
import { UserRole } from './enums/user-role.enum';
import { EmployerProfile } from './employer-profile.entity';
import { Resume } from './resume.entity';
import { Application } from './application.entity';
import { FavoriteVacancy } from './favorite-vacancy.entity';
import { VacancyView } from './vacancy-view.entity';

@Entity({ name: 'users' })
export class User extends AuditedEntity {
    @Expose()
    @Column({
        type: 'enum',
        enum: UserRole,
    })
    role: UserRole;

    @Expose({ name: 'first_name' })
    @Column({ name: 'first_name', type: 'varchar', length: 255 })
    firstName: string;

    @Expose({ name: 'last_name' })
    @Column({ name: 'last_name', type: 'varchar', length: 255 })
    lastName: string;

    @Expose({ name: 'middle_name' })
    @Column({
        name: 'middle_name',
        type: 'varchar',
        length: 255,
        nullable: true,
    })
    middleName?: string | null;

    @Expose()
    @Index({ unique: true })
    @Column({ type: 'varchar', length: 255 })
    email: string;

    @Exclude()
    @Column({ type: 'varchar', length: 255 })
    password: string;

    @Expose()
    @Column({ type: 'varchar', length: 50 })
    phone: string;

    @Expose({ name: 'is_verified' })
    @Column({ name: 'is_verified', type: 'boolean', default: false })
    isVerified: boolean;

    @OneToMany(() => EmployerProfile, (profile) => profile.user)
    employerProfiles: EmployerProfile[];

    @OneToMany(() => Resume, (resume) => resume.user)
    resumes: Resume[];

    @OneToMany(() => Application, (application) => application.user)
    applications: Application[];

    @OneToMany(() => FavoriteVacancy, (favorite) => favorite.user)
    favoriteVacancies: FavoriteVacancy[];

    @OneToMany(() => VacancyView, (view) => view.user)
    vacancyViews: VacancyView[];
}
