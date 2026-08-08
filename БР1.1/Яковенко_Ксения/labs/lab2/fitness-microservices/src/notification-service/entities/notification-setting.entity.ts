import { BaseEntity, Column, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('notification_settings')
export class NotificationSetting extends BaseEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int', unique: true })
  userId!: number;

  @Column({ type: 'boolean', default: true })
  emailEnabled!: boolean;

  @Column({ type: 'boolean', default: true })
  pushEnabled!: boolean;

  @Column({ type: 'boolean', default: true })
  workoutRemindersEnabled!: boolean;

  @UpdateDateColumn()
  updatedAt!: Date;
}
