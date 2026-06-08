import {
    Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, BaseEntity,
} from 'typeorm';
import { Conversation } from './conversation.entity';

@Entity()
export class Message extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Conversation, (c) => c.messages, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'conversationId' })
    conversation: Conversation;

    @Column({ type: 'int' })
    conversationId: number;

    @Column({ type: 'int' })
    senderId: number;

    @Column({ type: 'text' })
    body: string;

    @Column({ type: 'boolean', default: false })
    isRead: boolean;

    @CreateDateColumn()
    sentAt: Date;
}
