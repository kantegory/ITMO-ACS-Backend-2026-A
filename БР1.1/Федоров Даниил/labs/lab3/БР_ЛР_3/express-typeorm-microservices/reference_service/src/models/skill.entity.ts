import {BaseEntity, Column, Entity, PrimaryGeneratedColumn} from 'typeorm';

@Entity('skills')
export class Skill extends BaseEntity {
    @PrimaryGeneratedColumn({name: 'skill_id'})
    skillId: number;

    @Column({ type: 'varchar', length: 255, unique: true })
    name: string;

}