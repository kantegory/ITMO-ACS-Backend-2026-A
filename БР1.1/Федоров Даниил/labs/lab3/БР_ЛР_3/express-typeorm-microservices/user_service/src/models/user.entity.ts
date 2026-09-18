import { BaseEntity, Column, Entity, OneToOne, PrimaryGeneratedColumn, } from 'typeorm';

import { UserRole } from './enums';
import { Seeker } from './seeker.entity';
import { Employer } from './employer.entity';

@Entity('users')
export class User extends BaseEntity {
    @PrimaryGeneratedColumn({name: 'user_id'})
    userId: number;

    @Column({type: 'varchar', length: 240, unique: true})
    email: string;

    @Column({type: 'varchar', length: 255})
    password: string;

    @Column({type: 'varchar', length: 30})
    phone: string;

    @Column({type: 'enum', enum: UserRole})
    role: UserRole;

    @OneToOne(() => Seeker, (seeker) => seeker.user)
    seekerProfile?: Seeker;

    @OneToOne(() => Employer, (employer) => employer.user)
    employerProfile?: Employer;
}
