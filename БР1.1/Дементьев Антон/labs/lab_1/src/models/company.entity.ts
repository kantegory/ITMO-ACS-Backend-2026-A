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

@Entity('companies')
export class Company extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Index()
    @Column({ name: 'owner_user_id', type: 'uuid' })
    ownerUserId: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'owner_user_id' })
    owner: User;

    @Column({ name: 'industry_id', type: 'uuid' })
    industryId: string;

    @ManyToOne(() => Industry, { onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'industry_id' })
    industry: Industry;

    @Column({ type: 'varchar', length: 200, nullable: false })
    name: string;

    @Column({ type: 'text', nullable: true })
    description: string | null;

    @Column({ type: 'varchar', length: 255, nullable: true })
    websiteUrl: string | null;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
