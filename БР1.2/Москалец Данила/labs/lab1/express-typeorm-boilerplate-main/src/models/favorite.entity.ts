import {
    BaseEntity,
    CreateDateColumn,
    Entity,
    ManyToOne,
    PrimaryGeneratedColumn,
    Unique,
} from 'typeorm';

import { User } from './user.entity';
import { Service } from './service.entity';

@Entity()
@Unique(['user', 'service'])
export class Favorite extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @CreateDateColumn()
    createdAt: Date;

    @ManyToOne(() => User, (user) => user.favorites, {
        nullable: false,
        onDelete: 'CASCADE',
    })
    user: User;

    @ManyToOne(() => Service, (service) => service.favorites, {
        nullable: false,
        onDelete: 'CASCADE',
    })
    service: Service;
}
