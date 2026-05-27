import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    BaseEntity,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';

@Entity('companies')
export class Company extends BaseEntity {
    @PrimaryGeneratedColumn()
    company_id: number;

    @Column({ type: 'integer', nullable: false, unique: true })
    user_id: number;

    @Column({ type: 'varchar', length: 255, nullable: false })
    name: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ type: 'varchar', length: 500, nullable: true })
    website: string;

    @CreateDateColumn({ type: 'timestamp' })
    created_at: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updated_at: Date;
}
