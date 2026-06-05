import {
    Entity, Column, PrimaryGeneratedColumn, BaseEntity,
    ManyToOne, JoinColumn, CreateDateColumn, Index,
} from 'typeorm';
import { Conversation } from './conversation.entity';

@Entity('conversation_participants')
export class ConversationParticipant extends BaseEntity {
    @PrimaryGeneratedColumn() id: number;
    @Index() @Column({ nullable: false }) conversationId: number;
    @Index() @Column({ nullable: false }) userId: number;
    @CreateDateColumn() joinedAt: Date;
    @ManyToOne(() => Conversation, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'conversationId' }) conversation: Conversation;
}
