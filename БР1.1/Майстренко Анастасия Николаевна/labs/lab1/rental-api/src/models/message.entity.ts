import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    BaseEntity,
} from 'typeorm';

import { Conversation } from './conversation.entity';
import { User } from './user.entity';

@Entity()
export class Message extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Conversation, (conversation) => conversation.messages, {
        nullable: false,
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'conversationId' })
    conversation: Conversation;

    @Column({ type: 'int' })
    conversationId: number;

    @ManyToOne(() => User, { nullable: false })
    @JoinColumn({ name: 'senderId' })
    sender: User;

    @Column({ type: 'int' })
    senderId: number;

    @Column({ type: 'text' })
    body: string;

    @Column({ type: 'boolean', default: false })
    isRead: boolean;

    @CreateDateColumn()
    sentAt: Date;
}
