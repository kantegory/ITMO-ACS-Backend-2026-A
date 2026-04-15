import {
    BaseEntity,
    Column,
    Entity,
    JoinColumn,
    OneToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';

import { Service } from './service.entity';

@Entity()
export class Discount extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'int' })
    percentage: number;

    @Column({ type: 'timestamp' })
    startAt: Date;

    @Column({ type: 'timestamp' })
    endAt: Date;

    @OneToOne(() => Service, (service) => service.discount, {
        nullable: false,
        onDelete: 'CASCADE',
    })
    @JoinColumn()
    service: Service;
}
