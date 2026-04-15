import { BaseEntity, Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Message extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'int', nullable: false })
    conversation_id: number;

    @Column({ type: 'int', nullable: false })
    sender_id: number;

    @Column({ type: 'text', nullable: false })
    content: string;

    @CreateDateColumn({ type: 'timestamptz' })
    sent_at: Date;
}

