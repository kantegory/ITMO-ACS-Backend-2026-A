import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../common/base.entity';

export enum RequestStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

@Entity({ name: 'requests' })
export class Request extends BaseEntity {
  @Column({ name: 'service_id' })
  service_id: number;

  @Column({ name: 'user_id' })
  user_id: number;

  @Column({ type: 'enum', enum: RequestStatus, default: RequestStatus.PENDING })
  status: RequestStatus;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 2048, nullable: true })
  reply: string | null;

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