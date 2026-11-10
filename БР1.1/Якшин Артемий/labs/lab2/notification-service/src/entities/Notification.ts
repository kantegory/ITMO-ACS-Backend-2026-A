import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

// Уведомление, сформированное из доменного события очереди.
@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn({ name: 'notification_id' })
  notification_id!: number;

  @Index()
  @Column({ type: 'integer' })
  user_id!: number;

  // тип = routing key события (reservation.created, review.created, ...)
  @Column({ type: 'varchar', length: 64 })
  type!: string;

  @Column({ type: 'varchar', length: 200 })
  title!: string;

  @Column({ type: 'text' })
  message!: string;

  // исходные данные события (JSON-строка) — для трассировки
  @Column({ type: 'text', nullable: true })
  payload!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  created_at!: Date;
}
