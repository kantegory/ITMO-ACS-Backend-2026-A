import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    ManyToOne,
    JoinColumn,
    Index,
    CreateDateColumn,
    UpdateDateColumn,
    BaseEntity,
} from 'typeorm';

import { User } from './user.entity';
import { Industry } from './industry.entity';

@Entity('resumes')
export class Resume extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Index()
    @Column({ name: 'user_id', type: 'uuid' })
    userId: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({ name: 'industry_id', type: 'uuid' })
    industryId: string;

    @ManyToOne(() => Industry, { onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'industry_id' })
    industry: Industry;

    @Column({ type: 'varchar', length: 200, nullable: false })
    title: string;

    @Column({ type: 'text', nullable: true })
    summary: string | null;

    @Column({ type: 'int', nullable: true })
    salaryExpFrom: number | null;

    @Column({ type: 'int', nullable: true })
    salaryExpTo: number | null;

    @Column({ type: 'boolean', default: false })
    isPublished: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
