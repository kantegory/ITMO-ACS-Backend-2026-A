import {
    BaseEntity,
    Column,
    CreateDateColumn,
    Entity,
    ManyToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';

import { RequestStatus } from '../enums/request-status.enum';
import { Service } from './service.entity';
import { User } from './user.entity';

@Entity()
export class ServiceRequest extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({
        type: 'enum',
        enum: RequestStatus,
        default: RequestStatus.PENDING,
    })
    status: RequestStatus;

    @Column({ type: 'text', nullable: true })
    description?: string | null;

    @Column({ type: 'text', nullable: true })
    reply?: string | null;

    @CreateDateColumn()
    createdAt: Date;

    @ManyToOne(() => Service, (service) => service.requests, {
        nullable: false,
        onDelete: 'CASCADE',
    })
    service: Service;

    @ManyToOne(() => User, (user) => user.requests, {
        nullable: false,
        onDelete: 'CASCADE',
    })
    user: User;
}
