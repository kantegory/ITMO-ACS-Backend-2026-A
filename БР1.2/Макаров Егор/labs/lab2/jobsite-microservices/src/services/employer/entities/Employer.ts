import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('employers')
export class Employer {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'user_id', unique: true })
  userId!: number;

  @Column({ type: 'int', name: 'company_id', nullable: true })
  companyId?: number | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  position?: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
