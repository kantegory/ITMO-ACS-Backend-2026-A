import { Entity, Column, OneToOne, JoinColumn, Check } from 'typeorm';
import { BaseEntity } from '../../common/base.entity';
import { Service } from '../service/service.entity';

@Entity({ name: 'discounts' })
@Check('"percentage" BETWEEN 1 AND 99')
@Check('"start_at" < "end_at"')
export class Discount extends BaseEntity {
  @Column({ type: 'integer' })
  percentage: number;

  @Column({ type: 'timestamp', name: 'start_at' })
  start_at: Date;

  @Column({ type: 'timestamp', name: 'end_at' })
  end_at: Date;

  @OneToOne(() => Service, (service) => service.discount, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'service_id' })
  service: Service;

  @Column({ name: 'service_id', unique: true })
  service_id: number;

  // Helper method to check if discount is active
  isActive(): boolean {
    const now = new Date();
    return now >= this.start_at && now <= this.end_at;
  }
}
