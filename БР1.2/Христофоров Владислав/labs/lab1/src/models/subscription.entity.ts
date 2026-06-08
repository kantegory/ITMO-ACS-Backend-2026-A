import {
    Entity,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('subscriptions')
export class Subscription {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => User, (user: User) => user.subscriptions, {
        nullable: false,
    })
    @JoinColumn({ name: 'follower_id' })
    follower: User;

    @ManyToOne(() => User, (user: User) => user.subscribers, {
        nullable: false,
    })
    @JoinColumn({ name: 'following_id' })
    following: User;

    @CreateDateColumn()
    created_at: Date;
}
