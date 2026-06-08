import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    ManyToOne,
    OneToMany,
    JoinColumn,
    CreateDateColumn,
    BaseEntity,
} from 'typeorm';

import { User } from './user.entity';
import { Property } from './property.entity';
import { Message } from './message.entity';

@Entity()
export class Conversation extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => User, { nullable: false })
    @JoinColumn({ name: 'participantAId' })
    participantA: User;

    @Column({ type: 'int' })
    participantAId: number;

    @ManyToOne(() => User, { nullable: false })
    @JoinColumn({ name: 'participantBId' })
    participantB: User;

    @Column({ type: 'int' })
    participantBId: number;

    @ManyToOne(() => Property, { nullable: true })
    @JoinColumn({ name: 'propertyId' })
    property: Property | null;

    @Column({ type: 'int', nullable: true })
    propertyId: number | null;

    @OneToMany(() => Message, (message) => message.conversation)
    messages: Message[];

    @CreateDateColumn()
    createdAt: Date;
}
