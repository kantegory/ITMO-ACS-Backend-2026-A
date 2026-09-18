import {BaseEntity, Column, Entity, PrimaryGeneratedColumn, } from 'typeorm';

@Entity('experience')
export class ExperienceOption extends BaseEntity {
    @PrimaryGeneratedColumn({name: 'experience_id'})
    experienceId: number;

    @Column({ type: 'varchar', length: 100, unique: true })
    period: string;

}
