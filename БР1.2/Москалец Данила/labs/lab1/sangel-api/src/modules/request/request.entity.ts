// src/modules/request/request.entity.ts (убедись, что метод правильный)
import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/base.entity';
import { Service } from '../service/service.entity';
import { User } from '../user/user.entity';

export enum RequestStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

@Entity({ name: 'requests' })
export class Request extends BaseEntity {
  @ManyToOne(() => Service, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'service_id' })
  service: Service;

  @Column({ name: 'service_id' })
  service_id: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  user_id: number;

  @Column({ type: 'enum', enum: RequestStatus, default: RequestStatus.PENDING })
  status: RequestStatus;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 2048, nullable: true })
  reply: string | null;

  // Метод для проверки допустимых переходов статуса
  canChangeTo(newStatus: RequestStatus, isOwner: boolean): boolean {
    switch (this.status) {
      case RequestStatus.PENDING:
        if (newStatus === RequestStatus.ACCEPTED && isOwner) return true;
        if (newStatus === RequestStatus.REJECTED && isOwner) return true;
        if (newStatus === RequestStatus.CANCELLED && !isOwner) return true;
        return false;
      default:
        return false;
    }
  }
}