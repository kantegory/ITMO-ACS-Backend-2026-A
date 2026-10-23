import { BaseEntity, Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

// Журнал отправки писем. Текст письма и код здесь не хранятся.
@Entity('email_log')
export class EmailLog extends BaseEntity {
    @PrimaryGeneratedColumn('uuid') id: string;
    @Column({ type: 'varchar', length: 300 }) toEmail: string;
    @Column({ type: 'varchar', length: 50 }) template: string;
    @Column({ type: 'varchar', length: 20 }) status: string;
    @Column({ type: 'int', default: 1 }) attempts: number;
    @CreateDateColumn() createdAt: Date;
    @Column({ type: 'timestamp', nullable: true }) sentAt: Date | null;
}
