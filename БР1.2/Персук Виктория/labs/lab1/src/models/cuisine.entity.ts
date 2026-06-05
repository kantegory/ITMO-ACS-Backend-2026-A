import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('cuisines')
export class Cuisine {
    @PrimaryGeneratedColumn()
    cuisine_id!: number;

    @Column({ type: 'varchar', length: 150, nullable: false })
    name!: string;
}
