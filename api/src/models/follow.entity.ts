import {
    Entity,
    PrimaryGeneratedColumn,
    BaseEntity,
    CreateDateColumn,
    ManyToOne,
    Unique,
} from 'typeorm';

import { User } from './user.entity';

@Entity()
@Unique(['follower', 'following'])
export class Follow extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @CreateDateColumn()
    createdAt: Date;

    @ManyToOne(() => User, (user) => user.following, { nullable: false })
    follower: User;

    @ManyToOne(() => User, (user) => user.followers, { nullable: false })
    following: User;
}
