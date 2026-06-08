import {
    Entity, Column, PrimaryGeneratedColumn, OneToMany, CreateDateColumn, BaseEntity,
} from 'typeorm';
import { Message } from './message.entity';

@Entity()
export class Conversation extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'int' })
    participantAId: number;

    @Column({ type: 'int' })
    participantBId: number;

    // ссылка на объект из Catalog Service (опционально), без внешнего ключа
    @Column({ type: 'int', nullable: true })
    propertyId: number | null;

    @OneToMany(() => Message, (m) => m.conversation)
    messages: Message[];

    @CreateDateColumn()
    createdAt: Date;
}
