import { BaseEntity, Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

// owner_user_id и industry_id: ссылки на Identity и Reference (внешних ключей на другие БД нет)
@Entity('companies')
export class Company extends BaseEntity {
    @PrimaryGeneratedColumn('uuid') id: string;
    @Index() @Column({ name: 'owner_user_id', type: 'uuid' }) ownerUserId: string;
    @Column({ name: 'industry_id', type: 'uuid' }) industryId: string;
    @Column({ type: 'varchar', length: 200 }) name: string;
    @Column({ type: 'text', nullable: true }) description: string | null;
    @Column({ type: 'varchar', length: 255, nullable: true }) websiteUrl: string | null;
    @CreateDateColumn() createdAt: Date;
    @UpdateDateColumn() updatedAt: Date;
}
