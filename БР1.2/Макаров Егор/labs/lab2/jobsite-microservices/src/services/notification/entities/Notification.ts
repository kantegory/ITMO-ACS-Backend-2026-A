import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn()
  id!: number;

  // кому адресовано (компания работодателя)
  @Column({ name: 'company_id' })
  companyId!: number;

  @Column({ type: 'varchar', length: 50 })
  type!: string;

  @Column({ type: 'varchar', length: 500 })
  message!: string;

  @Column({ name: 'application_id', nullable: true, type: 'int' })
  applicationId?: number | null;

  @Column({ name: 'vacancy_id', nullable: true, type: 'int' })
  vacancyId?: number | null;

  @Column({ type: 'boolean', default: false, name: 'is_read' })
  isRead!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
