import { BaseEntity, Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Company } from './company.entity';

@Entity('vacancies')
@Index(['companyId', 'isActive'])
@Index(['industryId'])
@Index(['salaryFrom', 'salaryTo'])
@Index(['minExperienceYears'])
export class Vacancy extends BaseEntity {
    @PrimaryGeneratedColumn('uuid') id: string;
    @Column({ name: 'company_id', type: 'uuid' }) companyId: string;
    @ManyToOne(() => Company, { onDelete: 'RESTRICT' }) @JoinColumn({ name: 'company_id' }) company: Company;
    @Column({ name: 'industry_id', type: 'uuid' }) industryId: string;
    @Column({ type: 'varchar', length: 200 }) title: string;
    @Column({ type: 'text' }) description: string;
    @Column({ type: 'text', nullable: true }) requirements: string | null;
    @Column({ type: 'int', nullable: true }) salaryFrom: number | null;
    @Column({ type: 'int', nullable: true }) salaryTo: number | null;
    @Column({ type: 'int', default: 0 }) minExperienceYears: number;
    @Column({ type: 'boolean', default: true }) isActive: boolean;
    @CreateDateColumn() createdAt: Date;
    @UpdateDateColumn() updatedAt: Date;
}
