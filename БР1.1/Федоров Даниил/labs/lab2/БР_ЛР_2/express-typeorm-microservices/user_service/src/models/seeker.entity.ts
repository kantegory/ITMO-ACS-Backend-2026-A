import {BaseEntity, Column, Entity, JoinColumn, OneToMany, OneToOne, PrimaryGeneratedColumn, } from 'typeorm';
import { User } from './user.entity';
import { Resume } from './resume.entity';

@Entity('seeker')
export class Seeker extends BaseEntity {
    @PrimaryGeneratedColumn({name: 'profile_id'})
    profileId: number;

    @OneToOne(() => User, (user) => user.seekerProfile, {onDelete: 'CASCADE'})
    @JoinColumn({name: 'user_id'})
    user: User;

    @Column({name: 'first_name', type: 'varchar', length: 100})
    firstName: string;

    @Column({name: 'surname', type: 'varchar', length: 100})
    surname: string;

    @Column({name: 'middle_name', type: 'varchar', length: 100, nullable: true})
    middleName?: string | null;

    @Column({name: 'birth_date', type: 'date'})
    birthDate: string;

    @Column({name: 'city', type: 'varchar', length: 100})
    city: string;

    @OneToMany(() => Resume, (resume) => resume.seeker)
    resumes: Resume[];

}
