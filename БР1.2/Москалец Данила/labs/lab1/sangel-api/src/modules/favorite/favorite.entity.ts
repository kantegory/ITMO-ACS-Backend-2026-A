import { Entity, ManyToOne, JoinColumn, Unique, Column } from 'typeorm';
import { BaseEntity } from '../../common/base.entity';
import { Service } from '../service/service.entity';
import { User } from '../user/user.entity';

@Entity({ name: 'user_favorites' })
@Unique(['service_id', 'user_id']) // Один пользователь - одна запись на услугу
export class Favorite extends BaseEntity {
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
}