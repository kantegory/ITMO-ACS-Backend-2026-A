import {
    Entity, Column, PrimaryGeneratedColumn, BaseEntity,
    CreateDateColumn, UpdateDateColumn, OneToMany, Index,
} from 'typeorm';
import { Message } from './message.entity';

@Entity('conversations')
@Index(['userOneId', 'userTwoId', 'propertyId'], { unique: true })
export class Conversation extends BaseEntity {
    @PrimaryGeneratedColumn() id: number;
    @Index() @Column({ nullable: false }) userOneId: number;
    @Index() @Column({ nullable: false }) userTwoId: number;
    @Index() @Column({ nullable: true }) propertyId: number;
    @CreateDateColumn() createdAt: Date;
    @UpdateDateColumn() updatedAt: Date;
    @OneToMany(() => Message, (m) => m.conversation) messages: Message[];
}
