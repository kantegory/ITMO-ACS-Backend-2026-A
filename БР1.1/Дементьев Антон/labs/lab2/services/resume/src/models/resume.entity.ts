import { BaseEntity, Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

// user_id и industry_id: ссылки на Identity и Reference (внешних ключей на другие БД нет)
@Entity('resumes')
export class Resume extends BaseEntity {
    @PrimaryGeneratedColumn('uuid') id: string;
    @Index() @Column({ name: 'user_id', type: 'uuid' }) userId: string;
    @Column({ name: 'industry_id', type: 'uuid' }) industryId: string;
    @Column({ type: 'varchar', length: 200 }) title: string;
    @Column({ type: 'text', nullable: true }) summary: string | null;
    @Column({ type: 'int', nullable: true }) salaryExpFrom: number | null;
    @Column({ type: 'int', nullable: true }) salaryExpTo: number | null;
    @Column({ type: 'boolean', default: false }) isPublished: boolean;
    @CreateDateColumn() createdAt: Date;
    @UpdateDateColumn() updatedAt: Date;
}
