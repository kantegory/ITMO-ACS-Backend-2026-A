import {BaseEntity, Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn, } from 'typeorm';
import { User } from './user.entity';

@Entity('employer')
export class Employer extends BaseEntity {
    @PrimaryGeneratedColumn({name: 'profile_id'})
    profileId: number;

    @OneToOne(() => User, (user) => user.employerProfile, {onDelete: 'CASCADE'})
    @JoinColumn({name: 'user_id'})
    user: User;

    @Column({name: 'company_name', type: 'varchar', length: 255})
    companyName: string;

    @Column({name: 'company_website', type: 'varchar', length: 255, nullable: true})
    companyWebsite?: string | null;


}