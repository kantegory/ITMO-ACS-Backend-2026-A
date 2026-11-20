import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    BaseEntity,
    CreateDateColumn,
    UpdateDateColumn,
    OneToOne,
    OneToMany,
    JoinColumn,
} from 'typeorm';

import { User } from './user.entity';
import { Vacancy } from './vacancy.entity';

@Entity('companies')
export class Company extends BaseEntity {
    @PrimaryGeneratedColumn()
    company_id: number;

    @OneToOne(() => User, (user) => user.company, {
        nullable: false,
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'user_id' })
    user: User;

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

    @OneToMany(() => Vacancy, (vacancy) => vacancy.company)
    vacancies: Vacancy[];
}
