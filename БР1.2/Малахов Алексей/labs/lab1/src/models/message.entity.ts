import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    BaseEntity,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    DeleteDateColumn,
    Index,
} from 'typeorm';
import { User } from './user.entity';
import { Conversation } from './conversation.entity';

@Entity('messages')
export class Message extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Index()
    @Column({ nullable: false })
    conversationId: number;

    @Index()
    @Column({ nullable: false })
    senderId: number;

    @Column({ type: 'text', nullable: false })
    content: string;

    @Column({ type: 'boolean', nullable: false, default: false })
    isRead: boolean;

    @Index()
    @CreateDateColumn()
    createdAt: Date;

    @DeleteDateColumn()
    deletedAt: Date;

    @ManyToOne(() => Conversation, (conv) => conv.messages, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'conversationId' })
    conversation: Conversation;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'senderId' })
    sender: User;
}
