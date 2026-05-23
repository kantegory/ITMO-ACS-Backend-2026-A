import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    BaseEntity,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
    Index,
} from 'typeorm';
import { User } from './user.entity';
import { Property } from './property.entity';
import { Message } from './message.entity';

@Entity('conversations')
@Index(['userOneId', 'userTwoId', 'propertyId'], { unique: true })
export class Conversation extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Index()
    @Column({ nullable: false })
    userOneId: number;

    @Index()
    @Column({ nullable: false })
    userTwoId: number;

    @Index()
    @Column({ nullable: true })
    propertyId: number;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userOneId' })
    userOne: User;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userTwoId' })
    userTwo: User;

    @ManyToOne(() => Property, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'propertyId' })
    property: Property;

    @OneToMany(() => Message, (message) => message.conversation)
    messages: Message[];
}
