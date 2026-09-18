import {BaseEntity, Column, Entity, PrimaryGeneratedColumn,} from 'typeorm';

@Entity('industries')
export class Industry extends BaseEntity {
    @PrimaryGeneratedColumn({ name: 'industry_id' })
    industryId: number;

    @Column({ type: 'varchar', length: 150, unique: true })
    name: string;

}