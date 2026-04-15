import {
    BaseEntity,
    Column,
    CreateDateColumn,
    Entity,
    ManyToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';

import { Service } from './service.entity';
import { User } from './user.entity';

@Entity()
export class Review extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'int' })
    rating: number;

    @Column({ type: 'text', nullable: true })
    comment?: string | null;

    @CreateDateColumn()
    createdAt: Date;

    @ManyToOne(() => Service, (service) => service.reviews, {
        nullable: false,
        onDelete: 'CASCADE',
    })
    service: Service;

    @ManyToOne(() => User, (user) => user.reviews, {
        nullable: false,
        onDelete: 'CASCADE',
    })
    user: User;
}
